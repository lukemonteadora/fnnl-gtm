# The Aaron flow for FNNL (operator port, 2026-10-05)

**What this is.** FNNL runs the cold-outbound flow the way Aaron Shepherd runs it, with FNNL's own stack and safety rails kept. The operator approved this port on 2026-10-05: the process, the phases and the concepts from the A-Sales Aaron-flow work (A-Sales commits `b6d54de0..f4e368da`), and none of that workspace's tools. This file is the one place the Aaron-flow changes are listed. Every skill that changed points here with the marker **"Aaron flow (see `aaron-flow.md`)"**. Where this file and an older line in a skill disagree, this file wins. The record of what was ported, adapted or skipped is `outbound/reference/working-docs/_ASALES-PORT-2026-10-05.md`.

All of Aaron's numbers below are his own claims, from his Notion study notes (09-14 to 09-28) and his May 4 masterclass.

## 1. The operator's choices (2026-10-05)

1. **Aaron core plus FNNL's rails.** Aaron's order and methods end to end. Kept: truth, verified-only emails, suppression and the do-not-contact list, compliance and the FNNL opt-out default, the $100 standing budget, the tool-balance stop, the zero-workbench-credit rule, the no-AI-API rule, PAUSED drafts only, the kickoff Step 6 draft-upload stop, and the operator pressing Start. Research shrinks to Aaron's quick demand mining. Human checkpoints drop from four to two. The 500-company floor, the ~1,300 pooled read floor, the Cold-Reader Panel and every word cap become optional or advisory.
2. **Signals follow Aaron.** A broad, relevant list filtered on the offer. Signals only set the send order inside a campaign. No stacked-signal campaigns. (The A-Sales competitor-follower "switch" campaign is not ported: the operator skipped it.)
3. **FNNL's six tools only.** No new vendor and nothing from the A-Sales stack. List discovery follows the house order of 2026-10-06: an AI Ark company sample for keyword mining, then the full company export, the people and the first email rung in GetLeads (section 6; operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`). The lead reservoir is a local file of Giggal verdicts (section 7). The placement test is PlusVibe's own, after its cost is read (section 9). The dialer stays a manual step.
4. **Claude does every model job.** Wherever the A-Sales flow called a third-party model (company fit, title judging, copy variables, research, the Cold-Reader Panel), FNNL runs Claude Code sub-agents, batched by the hundred, never one per row (section 12).

## 2. Aaron's order, and the two human checkpoints

Aaron's order: infrastructure first (so warmup runs alongside everything else), then list, offer, copy, launch and reply handling. The ICP filter and the offer are one decision: the list is filtered on what the offer needs.

| Phase | Human stop? | What changes |
|---|---|---|
| 1. Onboarding | **No.** Auto-approved. | Same context sweep, website scrape and folder refresh (FNNL's hard rules). Intake adds the five Aaron fields (section 3). The ICP and segments are shown at checkpoint A for information and correction, not asked here. The phase writes its handoff, runs `checkpoint` then `approve --answer "auto: Aaron flow, no checkpoint 1"`, and continues straight into Phase 2 in the same thread (a fresh thread is also fine). |
| 2. Research and offer | **Yes: checkpoint A, the one "go ahead".** | Quick demand mining instead of the Research QA gate (section 4). The Aaron offer call. The AI Ark company sample (200 to 300 companies) and keyword mining per vertical (section 6), which is also the targeting preview. Checkpoint A carries every question the rest of the run needs (section 2.1). |
| 3. List | **No.** Auto-approved. | The GetLeads company export on the refined search, company fit, the GetLeads people search, the reservoir first, the email waterfall, verification, list QA, signals as order. A QA failure holds only its campaign and is shown at checkpoint B. The Aaron campaign and copy call stays here. Ends with `checkpoint`, then `approve --answer "auto: Aaron flow, no checkpoint 3"`, then "Say Phase 4 for <client>" (a fresh thread is recommended, because Phase 3 is long). |
| 4. Copy and launch | **Yes: checkpoint B, the launch review.** | Aaron's copy with the rails, the reply machine, PAUSED drafts in PlusVibe, Gates A to D. It also shows Aaron's launch set, the list counts and QA grades, and every item held in Phase 3. The operator presses Start. |

`phase_state.py` is unchanged: an auto phase still writes its handoff and runs `checkpoint` then `approve`, so the tracker, the freeze and `/continue-client` work as before. "Checkpoint A" is the old checkpoint 2 and "checkpoint B" is the old checkpoint 4. The script's phase numbers do not change. FNNL's one extra stop, the kickoff Step 6 draft-upload stop (a core sweep source still blocked and not waived, or a found blocklist not yet in suppression), is unchanged.

### 2.1 Checkpoint A: the one up-front batch

Find it first (the ask policy in `phase-protocol.md` section 3 is unchanged). Then one native prompt, up to four questions, with a second prompt allowed only when more remain:
- "Go ahead: build the list and the drafts" (recommended). Aaron's offers, the ICP, the segments and the refined search per vertical (its count, the sample's fit rate, the include and exclude keywords) are shown for information. A swap or correction the operator makes rides in this answer and wins.
- The targeting-preview categories no ruling answers (the edge cases the 200-row sample surfaced).
- The do-not-contact list, the speed-to-lead owner and the booking link, and a core sweep source that could not be read. Each is asked only when the find-it-first order has no answer.
- The GetLeads export OK (once per client, ruling `getleads-export`). Since 2026-10-06 every run uses a GetLeads export (the full company export and the people search), so it is asked unless the client's `rulings.md` already holds it.
- The PlusVibe placement test OK, only when no ruling answers it, with its cost read first (section 9).
- A budget raise, only when the estimate (GetLeads plan credits for the export, the people and the email rung, AI Ark credits for the sample, any parallel pull and the email finder, Prospeo, Giggal) crosses the $100 standing budget.

**One exception stays in Phase 1.** A website no route can read, or a `no_website` to confirm, is asked as one line at the end of Phase 1, because the hard rule blocks research until the site is resolved.

After checkpoint A, Phases 3 and 4 run straight through. Mid-run stops are still only the four in `phase-protocol.md` section 3, plus the Step 6 draft-upload stop.

## 3. Onboarding additions (Aaron 09-16, 09-17, 09-21)

The intake (`/icp-onboarding`, `/client-intake-form`) adds five fields, each pre-filled from the sweep, the website and the call notes before anything is asked:
- **`icp.recent_win`**: the most recent client that bought and did well (Aaron builds the ICP from a past win).
- **`icp.disqualifiers`**: who never buys, in plain words.
- **`icp.supplier_exclusions`**: companies that sell *to* the buyers but never buy (vendors, IT firms, brokers, agencies, consultancies in the same market). These are excluded in discovery filters and in company fit.
- **`icp.why_now_signals`**: the two or three signals that make an account worth contacting now. They set send order only (section 5), never shrink the list.
- **`icp.competitors`**: named competitors with their domains. They feed research (section 4), the discovery exclusions (their domains and employees are never prospects) and the copy's truth check.

`client-profile.yaml` stays the ICP source every step reads. `/lead-scoring` reads the offer's `title_stack`, so the scoring tiers and the list use the same titles.

## 4. Research: Aaron's quick demand mining (09-21)

- **Known market** (the client has case studies or a `recent_win` in the segment, or another FNNL client already has research in the same vertical): no new external research. Reuse what exists, then go to the offer call.
- **Unfamiliar market**: one quick pass, fanned out to Claude research sub-agents launched together, on the routes the no-AI-API rule allows:
  - LinkedIn and X (through WebSearch) for objections and competitor chatter; Reddit only when the operator pasted threads (otherwise logged unread);
  - the Meta Ad Library (the read-only browser pane) for the offers competitors pay to run;
  - the competitors' own sites for their front-end offers.
- Evidence still goes into `_research/evidence.csv` through `evidence_ledger.mjs`, because that is cheap. `/market-evidence synthesize` runs as a short clustering with no gate. The Research QA gate (its checks, DEEPEN loops, HOLD) is **off by default** and runs only when the operator asks.

## 5. Targeting and signals (Aaron 09-14, 09-28)

- **A broad, relevant list filtered on the offer.** Filter on what the offer needs (Aaron: only SaaS with a free trial, because the offer sells trial sign-ups). Filter on any buying signal that is observable for free in the AI Ark filters (technologies, headcount growth, funding, hiring). Paid intent data is used only when the buying signal is genuinely hidden.
- **Signals set send order, never the campaign.** Company and contact signals (including `contact_new_in_seat` and the `why_now_signals`) are joined onto rows by `company_domain` as before and feed `/lead-scoring` P1 to P5, which orders the send inside the broad campaign. The list engine writes each campaign file P1 first. Whether PlusVibe sends in import order is unverified until the first send day is checked. No campaign is built from stacked signals. A stacked-signal slice may run only as a labeled test arm against a broad arm on the same offer (`/experiment-design`, "broad vs stacked").
- **Contact signals outrank company signals as an ordering rule**: they rank first in the send order, not as separate campaigns.
- **Floors are advisory.** The 500-company campaign floor and the ~1,300 pooled read floor are numbers shown in reports. They never block a campaign.

## 6. Discovery: an AI Ark company sample and keyword mining, then GetLeads (operator directive 2026-10-06)

The house order (operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`; it supersedes the 2026-10-05 AI-Ark-only people search, ruling `people-discovery`). The full procedure is in `outbound/reference/ai-ark-people-discovery.md`. In short:

1. **Company sample and keyword mining in AI Ark, per vertical.** Run the AI Ark company search with every filter on a sample of 200 to 300 companies, score their fit (good, maybe, bad) with batched Claude sub-agents, then mine the keywords and industries: every one common to the good-fit companies becomes an include, every one common to the bad-fit companies an exclude, and one common to both is used on neither side (`outbound/scripts/keyword_mine.py`). All of them are used: there can be tens or hundreds, with no cap and no hand-pruning. The output is the refined search.
2. **Full company export in GetLeads.** The refined search (filters plus every include and exclude) runs in GetLeads and the whole company list is exported. AI Ark may run the same export in parallel, deduped by company domain, only if its export is fast; if slow it is skipped. Company fit is judged once per company domain before any people spend.
3. **People in GetLeads.** The offer's title stack at the companies that passed fit. AI Ark may run the same people search in parallel (`outbound/scripts/aiark_people.mjs`, sliced under its 10,000-result cap), deduped by person (LinkedIn slug, then email), only if fast.
4. **The email waterfall** (section 8): GetLeads, Giggal, AI Ark, Giggal, Prospeo, Giggal.

- **Discovery exclusions ride on every search** (ruling `discovery-exclusions`): the keyword exclude stack, the irrelevant industries, the client's own domain, its clients, competitors, `icp.supplier_exclusions` and suppression. Anything a call cannot carry is applied after the pull on the returned company fields.
- Exhaust-then-gap-fill stays the rule for the email waterfall and enrichment columns. The optional AI Ark parallel searches are parallel sources deduped against GetLeads, never gap-fill rungs.

## 7. The lead reservoir, on Giggal

- **Store:** `outbound/profiles/_reservoir/contacts.jsonl`, local and gitignored with the rest of `profiles/`. One row per person, keyed by LinkedIn slug (falling back to lowercase email). Fields: identity, title, company, domain, email, Giggal verdict, `verified_at`, source tool, `first_seen` and `last_seen`.
- **What it never holds:** client names, campaign membership, suppression rows, client-supplied lists, or anything a client gave us. Only rows FNNL's own tools returned go in.
- **Order:** the reservoir is rung 0 of the email waterfall, a free cache in front of it (kept under the 2026-10-06 order). A person with a reservoir match whose email Giggal rated `valid` in the last 90 days is verified on that email first, before any finder rung is paid. Giggal still verifies every email that ships.
- **Write-back:** every Giggal verdict a person's candidate emails got is written back after verification.
- **Script:** `outbound/scripts/reservoir.py` (`lookup`, `writeback`, `stats`).

## 8. List rules

- **No contacts cap** (ruling `no-contacts-cap`). Every verified buyer at a fit company goes into the campaign. The send order is spread across companies instead: the split stage writes each campaign file round-robin by company inside each priority tier, so one company's buyers are not all sent on the same day.
- **Every candidate email, in rank order, until the first valid** (ruling `every-email-verified`). Rank: the reservoir's recent `valid`, then an email the row already carries, then GetLeads (by LinkedIn URL), then the AI Ark email finder, then Prospeo (the contract order since 2026-10-06, operator directive, see `standing-rulings.md` `discovery-flow`: AI Ark never opens on a person GetLeads has not tried, and Prospeo never on one AI Ark has not tried). Giggal verifies after each rung and the walk stops at the first `valid`. Only `valid` and `catch_all` are accepted: a catch-all ends the walk and ships labelled `catch_all` (ruling `catch-all`, updated 2026-10-06); unknown, invalid, disposable and unverified emails never ship.
- **Email domain must match the company.** A personal-domain email is dropped. A work email on a different domain ships only when that domain is proven to be the same company: a colleague at the same company already verified on it, or a brand domain the company's own site or AI Ark record names. Anything else is dropped as a wrong-company email.
- **Fit ship rule** (ruling `fit-ship-rule`). Company fit ships `good` and `maybe`; only `bad` drops. An unsure `bad` that escalation did not settle stays `bad` and drops, labeled `needs_review`; it is never relabeled `maybe`.
- **Fit runs on companies, never contacts** (ruling `company-level-only`). One row per `company_domain`; contacts get the verdict by a join.

## 9. Copy (Aaron 09-14, 09-21, 09-28)

- **Aaron reads Notion live, with no snapshot fallback.** The Aaron-lane call prompts tell the sub-agent to reason from his live Notion section and treat the frozen corpus files as out of date. If Notion cannot be read, the call stops. The mirrored `/ask-aaron` skill is not edited; the exception lives in the call prompt (`aaron-lane.md`).
- **Frame refresh before every copy call.** Before Call 2, the session checks Aaron's Notion study notes published after the newest date in `aaron-copy-frames.md`'s change log. Any new model email, subject pattern or CTA becomes a new dated "live" frame. Frames are only added, never deleted.
- **Length:** no word cap. The frame's sentence count governs. The 25-to-35-word contract in `/spam-word-checker` and `/personalization-subagent-pattern` does not apply to Aaron-lane copy. The Cold-Reader Panel is **optional** and runs only when the operator asks (`cold_reader_panel.py`, Claude sub-agents). Its word ceiling applies only when it runs.
- **Subject:** two or three lowercase words that read like an internal note typed on a phone. One subject per campaign, never A/B tested.
- **Personalization:** hand-written copy with at least one real detail that ties to why they would buy (Aaron 09-28: "a minimum like one real detail"), kept to the few details the frame has slots for. The two company variables are the prospect's own customers (`sells_to_vertical`) and the service they sell (`service_offered`), written once per shipped company by batched Claude sub-agents from the text the fit pass already read. No scraped compliment and no per-lead AI body.
- **No blank variable ever ships.** `outbound/scripts/copy_var_gate.py` checks every PlusVibe `{{variable}}` the copy uses against the lead file before upload: a blank row gets the frame's fallback wording or is held, never sent with a hole.
- **Send settings:** plain text, open tracking off, three Email 1 variants, two steps (ruling `sequence-length`). Everything else follows FNNL's launch-settings rulings (`launch-settings`, `launch-timezone`, `senders`, `signature`).

## 10. Deliverability (Aaron 09-28: deliverability first)

- **Mailbox age clock.** Track each mailbox's sending days (days it was in the active rotation and sent). Around **45 sending days**, the weekly rhythm recommends ordering and warming the replacement batch (two weeks of warmup). Around 60 to 90 sending days, the mailbox is due to retire. Sending days, not calendar days, because rotation already rests each mailbox part of the time. Nothing is bought without the operator's explicit infrastructure approval.
- **Placement test: PlusVibe's own.** Gate B needs one pass before Start, and another runs before an offer is blamed for a reply-rate drop. Before the first use, read what a PlusVibe placement test costs on FNNL's plan; a test with a cost goes through `/api-cost-governance`. The test sends real emails from the client's mailboxes to PlusVibe's seed inboxes, so it runs only on the operator's OK (asked once at checkpoint A, then stored as a ruling). A test that was not run is stated as a gap, never presented as a pass.
- **Complaint proxy.** Hostile replies per 1,000 sends are reported weekly beside bounce.

## 11. The reply machine (Aaron 09-14, 09-21)

- **The target:** a human reply and a call within about 5 minutes of an interested reply. Until an alerting route is set up, the PlusVibe reply sweep runs frequently.
- **The call script is a situation tree.** Its branches:
  - no answer: a voicemail and a text;
  - a gatekeeper;
  - an answer: name yourself and the client, say "you just replied to my email about <offer>", qualify, then offer two slots;
  - "send me info";
  - "not now";
  - the top objection.
- **Every interested reply is called, asset requests included** (ruling `call-every-interested-reply`). The delivery email stays pure value with no calendar push; the call follows within about 5 minutes.
- **Qualification before costly free work** is unchanged (Aaron's cherry-pick).
- **Measure interested-to-meeting on its own** (`meeting_book_rate`). Aaron reports 20 to 25% and aims for 30%.

## 12. Cheap at volume: one list process, two modes, Claude in batches

**The rule.** Lists run to tens of thousands of companies. Model work never fans out one sub-agent per row: that burned a whole weekly usage limit on an earlier build. One process runs with one dial, `run_state.list_mode`, mirrored into the targeting spec as `buyers.list_mode` (ruling `list-mode`).

**How every model job runs.** Deterministic code first (the AI Ark filters, the keyword screen, `title_classify.py`'s free rules). Then Claude sub-agents on what is left, each taking a file of a few hundred rows and writing its own output file, at most about 10 at once, merged by id with a count check and a resume for any missing or malformed batch (`/personalization-subagent-pattern`). Tier per `/ai-model-routing`: `sonnet` for company fit and the copy variables, `haiku` only after the 20-row agreement check passes for that job.

**`volume` (the default).**
- **Company fit:** batched Claude sub-agents read the company text the company export already returned (description, keywords, industries, headcount, location). No per-company crawl for the first read. It runs once per company domain, before any people spend (`ai-ark-people-discovery.md`, step 2). A company whose text lacks an attribute the campaign needs is held as `maybe`, never dropped, and only those get a free site re-read (`site_reread.py`, Step 2.5, ruling `attribute-reread`, 2026-10-12); the ~40% attribute floor is measured after the re-read.
- **Ambiguous titles:** `title_classify.py` decides most titles for free; batched Claude sub-agents judge each distinct leftover title once, and `--merge-ai` reads the result. Lean to a buyer tier when unsure (`adjacent` and `weak` are kept).
- **Copy variables:** batched Claude sub-agents write `sells_to_vertical` and `service_offered` once per shipped company, from the text the fit pass read. No new fetch.
- **Per-company web research is off.** Send order comes from the free structured signals in the exported rows.
- **Lead score:** it only orders the send, so it auto-locks on `lead_score.py`'s own checks. No review rounds.

**`yield` (fewer than 2,000 companies pass company fit).** Phase 3 switches the run to `yield` and logs why. Every lever that recovers good companies turns back on: a homepage read (WebFetch) to settle the maybes and low-confidence rows, one widened title pass, and per-company research for send order, still in batches.

## 13. Limits removed because Aaron never set them

**The rule.** No step caps how many leads are pulled, tested or sent unless Aaron set that limit, a tool forces it, or one of the operator's rails in section 14 requires it. Every skill line that still states one of these limits points here with the marker **"Aaron flow (see `aaron-flow.md` section 13)"**, and this section wins.

**What Aaron says about volume (paraphrased, his claims).** His numbers are floors: about 1,000 prospects per segment before judging it, about one booked call per 1,000 sends as his keep-or-cut line, three or four offers, at least 10,000 to 20,000 sends a month, the whole TAM in about 90 days. Validating an offer takes thousands of sends; a big, relevant, slightly dumb list; signals sort the list rather than shrink it; the daily limit is the maximum the infrastructure allows.

**The 14 limits, and what replaces each.**

1. **Per-company contact caps** (`contacts_per_account`, `max_contacts_per_account`, a same-wave contact cap, a per-company simultaneity cap). Removed (ruling `no-contacts-cap`); round-robin by company inside each priority tier replaces them. A minimum-persons-per-account setting only labels coverage.
2. **The 5 to 10% signal-test share, and signal arms that wait for a proven offer.** Removed. A stacked arm runs beside the broad arm at whatever volume its slice holds.
3. **The offer-count formula `max(3, floor(qualified_contacts / 2000))`, with extra offers queued for later.** Aaron's offer call sets the count (default context "three or four"). Every offer he names launches in the first wave; only his own `later` label queues one.
4. **Parking unread arms.** An arm waiting for its read keeps receiving first touches. Only an arm read as a loser stops.
5. **Send volume held down by choice.** The campaign's daily new-lead limit is sized from capacity (healthy senders times their daily limits) against its own lead count. A lower inherited value does not win and no gentler ramp is chosen as strategy. Per-mailbox limits, warmup and rotation stay.
6. **Decisions on tiny samples.** A 50-lead A/B, `/roast`'s 20-to-30-prospect check as a gate, and a targeting change after 30 sends no longer drive a decision. An arm is read at about 1,000 prospects or sends; `list_feedback.py --min-sends` defaults to 1,000. `/roast` stays an optional advisor.
7. **Keeping campaigns few.** Removed. The wave is a portfolio; Aaron's campaign call sets how many.
8. **Tuesday-to-Thursday sending, and one email plus a re-send for a huge TAM.** Send days follow FNNL's launch-settings rulings (the target market's working week); two steps (ruling `sequence-length`).
9. **The 500-company floor wherever a line enforced it.** Advisory (section 5).
10. **The ~1,300 pooled floor as a "hard minimum".** Replaced by Aaron's advisory reading guide: about 1,000 per arm, about one booked call per 1,000 sends. An arm under it is read and labeled thin, never held unread.
11. **Signals that build their own campaigns.** Send order only (section 5).
12. **Word caps and subject rules on Aaron-lane copy.** The 25-to-35-word band, the 50-word follow-up cap, the 90-word maximum, the 100-word panel ceiling outside a panel run, the 2-to-4-word subject, subject A/B tests and a new subject on the last follow-up do not apply. The frame's sentence count sets length; one subject of two or three lowercase words per campaign.
13. **The Research QA gate running on its own.** Off by default (section 4).
14. **Client capacity capping sends.** Capacity caps the free units given each week (`offer.qualification.free_unit_cap_per_week`), not how many people are emailed.

**Kept, because they are Aaron's own:** two to three emails per sequence (FNNL's two-step ruling sits inside that), three Email 1 variants, one proof point, one subject, per-mailbox limits, warmup and rotation, filtering on what the offer needs, qualifying who gets the free offer.

**Kept, because they are tool mechanics or the operator's rails:** the spend budget, verified-only emails, suppression, the 25-account list QA, the sample-first rule (now the 200 to 300 company AI Ark sample), AI Ark's page size and 10,000-result cap, import and fair-use limits.

## 14. What is not changed

- FNNL's six tools and the stack contract; the no-AI-API rule; the zero-workbench-credit rule and its hook.
- The context sweep, the live website scrape and the folder refresh.
- Giggal on every email. (The catch-all timing rule changed on 2026-10-06: a catch-all now ships labelled, ruling `catch-all`.)
- List QA, suppression, compliance and the FNNL opt-out default.
- The $100 standing budget, the tool-balance stop, PAUSED drafts only, the Step 6 draft-upload stop and the operator's Start.
- The ask policy and its mid-run stops.
- Aaron's final say, the client-fit check and the frame rule.
- The launch-settings rulings of 2026-10-01 (`sequence-length`, `senders`, `signature`, `launch-timezone`).
- The mirrored persona skills and the global `~/.claude/CLAUDE.md`, which are not edited from this repo.
