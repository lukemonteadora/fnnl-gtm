---
name: campaign-copywriting
description: Records the copy /ask-aaron writes in the Aaron lane into variants.yaml and copy.md, checked against the rails and his frames; runs the house stepwise flow only on the operator's ask. Use when writing email campaigns or cold email copy from a campaign strategy document, website, or client context.
---

**From the former description:** In the house flow, cold email copy is created through a stepwise flow, confirmed step by step under review_gates and picked and recorded without stops under auto_execute. Every initial cold email must follow outreach-copy-framework.md, and every subject line, opener, body, CTA, follow-up, and YAML variant must pass spam-word-checker.md and cold-email-copy-best-practices.md before being shown, approved, serialized, or uploaded. In recorder mode (the default) spam-word-checker.md still runs, as a rail.

# Campaign Copywriting Skill
## Canonical Profile Root

All profiles/<business-slug> paths in this skill resolve under:

```text
<outbound>/profiles
```

Here `<outbound>` is the root of this skill library - resolve it to wherever the library is currently checked out (local Documents, OneDrive, or a git worktree); never hardcode an absolute path. Do not create client profiles under a `profiles/` folder at your current working directory.

You are a cold email copywriter. Your job is to create cold email campaigns through a stepwise confirmation process that locks strategy before final copy is produced.

This skill is not allowed to output unreviewed copy. Every piece of outbound copy must pass the Copy QA Gate before it is shown to the user or written into `variants.yaml`.

**The Aaron lane: by default this skill records Aaron's copy (operator directive 2026-09-24; `outbound/reference/aaron-lane.md`).** The copy is written by a fresh `/ask-aaron` sub-agent in Call 2 of the lane, the campaign and copy call, and his call is final below the operator. On the default path this skill runs in **recorder mode** (`/phase-4-copy-launch` step 1). Once the campaign's list is verified, it writes `variants.yaml` and `copy.md` from `aaron-copy-call.md` word for word (his subject, Email 1 variants, follow-ups and delays), fills the `copy.md` header lines from his call, and runs only the rails in `aaron-lane.md`: truth (the Proof-Asset Gate, capability truth, pain lines that trace to a cluster), `spam-word-checker.md`, the send format (no em dashes, `{{double_braces}}` variables that exist as columns with a fallback, no signature in the body, block-scalar bodies, markdown and YAML identical), compliance, and the Confirmed Deliverable Gate. It also runs the frame-conformance check at the end of `outbound/reference/aaron-copy-frames.md` (the operator's rule, 2026-09-24): every subject, email and delivery reply names one of Aaron's own frame ids (F1 to F11, S1 to S5, P1 to P5, FU1 to FU4, DR), keeps that frame's slot order, sentence count and fixed words, fills its slots with this client's facts, and carries its frame map into `copy.md`. `python outbound/scripts/aaron_frame_check.py --client <slug>` runs that check on the record: exit 0 means no FAIL (its WARN lines are for a person to confirm), 1 means at least one email broke its frame, 2 means the record could not be found or read. For the recorder, the Copy QA Gate means these rails and that check. A failed rail or frame check goes back to a fresh Aaron sub-agent for one fix round; if it still fails, only that item is held and shown at the launch review (checkpoint 4, `/phase-4-copy-launch`). The stepwise direction rounds, the Framework A anatomy and word band, the three-variant default, the one-question and subject-token rules, the approved CTA list and the other style checks in `references/` are house defaults his copy may depart from (recorded in `copy.md` under Shape and labeled variants). They run as the authoring procedure only when the operator asks for the house copywriter, and that draft then goes to Aaron, who still decides.

## Recorder mode: the default path

This is the order of work when the copy comes from Aaron, which is the default (`/phase-4-copy-launch` step 1). Each step points to the section that holds its rule, and nothing here adds a rule. For the house copy flow (only when the operator asks), start at `references/house-flow.md` instead.

1. **Read the state.** The activity log's CURRENT STATE (Activity Log Protocol below), then `client-intel.md` as Client intel read (below) says.
2. **Run the List Gate** (below). If it fails, stop and route to its producer.
3. **Read the Aaron lane.** In `outbound/reference/aaron-lane.md`: "Call 2: the campaign and copy call", "The rails (Aaron cannot override these)", "What now yields to Aaron" and "What is off the default path". In `outbound/reference/aaron-copy-frames.md`: the frame-conformance check at its end. Then the `aaron_campaign_call` block in `profiles/<business-slug>/aaron-copy-call.md`. If that file or `run_state.aaron_lane.copy_call` is missing, the copy predates the lane (`aaron-lane.md`, Existing clients).
4. **Leave the house style guides unread.** Required Guardrails (`outreach-copy-framework.md`, `cold-email-copy-best-practices.md`) and the house sections in `references/` are not applied to Aaron's copy. `spam-word-checker.md` still runs, as a rail (`aaron-lane.md`, the rails).
5. **Compliance.** Run the opt-out ruling check (Compliance, below) and carry the ruling into `copy.md`.
6. **Truth and deliverable gates.** The Confirmed Deliverable Gate and the Proof-Asset Gate (below), plus the rail checks under Copy QA Gate (capability truth, pain lines that trace to a cluster). A client-honored offer at `pending` is recorded like any other and marked Start-held; one at `no` or `vetoed` gets no copy (Confirmed Deliverable Gate).
7. **Record.** Write `variants.yaml` and `copy.md` from his sequence word for word (variants.yaml Requirement and copy.md Requirement, below), fill the `copy.md` header lines from his call, and carry each email's frame and frame map into `copy.md`. The recording runs in the native Claude Code session (AI/API Routing, below).
8. **Check.** Run the rail checks under Copy QA Gate and `python outbound/scripts/aaron_frame_check.py --client <slug>` (exit 0 passes; 1 is a frame FAIL; 2 means the record could not be read, so fix that first), then re-open the saved `variants.yaml` and scan it as the upload tool will read it.
9. **On a failure.** Send the failing item to a fresh Aaron sub-agent with the rail it broke, for one fix round. If it still fails, hold only that item and show it at the launch review.
10. **Log and hand off.** Append the activity-log line, then follow What To Do Next (spintax, then the upload stop and the paused drafts; `/phase-4-copy-launch` steps 4, 6 and 7).

Where a section below says Copy QA Gate, recorder mode means the rails and the frame check (the Aaron lane paragraph above).

---

## Stack Resolution (read before any tool step)

This skill names **capability roles**, never specific vendors. Resolve every role to the
tool this workspace has actually chosen by reading:

```text
outbound/stack-contract.yaml
```

Roles this skill uses: sending platform, email verifier, waterfall enricher.

**If a role this step needs is empty or missing in the contract, STOP and route to
`/stack-setup`.** Never substitute a guessed vendor, and never hardcode a tool name into
an artifact this skill writes.

---

## Material Decision Rule

The full Material Decision Rule moved verbatim to `references/policies-and-related-skills.md`. Read it at any material fork in this skill.

## Interaction Policy

The full Interaction Policy (it defers to `/autonomous-execution-policy`, and a run stops only at the one checkpoint that closes each of the four phases, `outbound/reference/phase-protocol.md`) moved to `references/policies-and-related-skills.md`. Read it before any `auto_execute` or `review_gates` decision in this skill.

---

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short: record status, not raw output. Full protocol: `client-activity-log.md`.

## Client intel read (Input Sources)

This bullet of Input Sources binds every path, so it lives here. The rest of Input Sources is house flow (`references/house-flow.md`).

- `profiles/<business-slug>/client-intel.md` (the client intel feed, read right after the activity log's CURRENT STATE): Needs attention and Open items in full, plus Recent activity tagged `copy` or `offer`, for copy the client approved or rejected, claims they vetoed, and new proof they mentioned. A meeting or Slack item is a hypothesis: it never silently overwrites an operator-confirmed value or a locked decision, and a conflict goes to the operator (under `auto_execute`, a conflict touching offer, list, copy or launch stops this step and asks). A missing feed, or one that is stale by the rule in `client-intel-feed.md`, is a one-line flag at the top of the report, never a blocker; offer `/client-intel-sync <client>` for a fresh pull. Protocol: `client-intel-feed.md`.

---

## AI/API Routing: native Claude Code session (HARD RULE)

Final copy and phone scripts are **written in the native Claude Code session** (no-AI-API rule, operator directive 2026-09-22; this supersedes the 2026-06-17 "generated via the Claude API by default" directive, and its no-key fallback branch is gone because native is the path). A clean-packet sub-agent (the Agent tool, handed only the packet) is fine, and helps context hygiene on a long run. Write only from a clean research packet (schema: `/ai-model-routing`, Clean Research Packet: persona, account/business/technical context, verified signal plus evidence URL, pain, proof point, offer/CTA direction, constraints), plus three research fields: `buyer_language` (the verbatim buyer phrases this copy may borrow, each with its evidence ID, from the Language bank in `_research/pain-clusters.md`), `current_workaround` (what the buyer does today instead, from the cluster the offer arm answers), and `cluster_ids` (the clusters the offer arm answers, from its `offer.validation_arms` entry, or the primary's block). Do not feed the writer raw crawl output, tool logs, research scratch, or the raw evidence ledger. No outside AI provider, API key, router script, or list-workbench AI column drafts, briefs, or polishes copy at any stage.

Record the engine in `ai_copy_provider` (`claude-native`, or `claude-native (sub-agent)` when a clean-packet sub-agent wrote it). Routing never bypasses the Copy QA Gate below or the Required Guardrails above: the QA gate runs identically whichever of the two drafted the copy.

---

## Copy QA Gate

Run this gate before Step 2 output, Step 3 output, Step 4 output, and before writing `variants.yaml`.

### Copy Surfaces To Scan

- subject lines
- first lines
- body copy
- CTAs
- P.S. lines
- follow-ups
- closeout lines
- variable values used inside copy
- every markdown variant
- every YAML `subject` and `body`
- the raw serialized `variants.yaml` file exactly as the upload tool will read it
- every spintax branch, if spintax is included

### Gate Requirements

- Pass `spam-word-checker.md`. It enforces formatting, CTA, opener, and voice discipline, not a banned-word keyword list (that list was removed 2026-09-18; see that file for why).
- Remove em dashes, double hyphens, and mid-sentence dash separators from sendable copy. (Aaron's own rule too: "no m dashes ever, that screams ChatGPT", doctrine §9.)
- Confirm every CTA references a deliverable or next step with a named honorer for every yes: the agency by default, the client only with `lead_magnet_client_ok: yes` (Confirmed Deliverable Gate). A client-honored offer at `pending` is drafted Start-held with no unconfirmed client term in its copy; at `no` or `vetoed` nothing is written (Offer Readiness, operator decision 2026-09-28).
- Confirm every claim the copy makes about the client's own product or service maps to a real, deliverable capability. No invented features, integrations, tools, metrics, or results the client cannot fulfill (capability truth, Hard Rule 28). This is most important when copy is AI-generated at scale.
- Confirm the Proof-Asset Gate passed: any named client, case study, or exact number the copy leans on is real and on file. No vague stand-in ("a leading firm"), no unnamed placeholder where the angle needs a name, no invented metric, no silent omission of proof the angle needs. If a BLOCK-tier proof gap exists, copy for that angle is held and the fill-in form (proof-asset-request.md) routed to the client, not papered over.
- **Confirm every pain, objection or workaround line traces to the research** (`market-evidence-standard.md` section 13). Each one cites a cluster ID in `_research/pain-clusters.md` (recorded on the `copy.md` Research basis line), or is phrased as a genuine question the reader can answer either way rather than as a claim. The question branch never licenses what the kill-list above bans: no question-form pain opener, no loaded hypothetical, no unverified problem assumption ("Still losing money to X?"). A `model_hypothesis` (a model's persona research, or the client's unverified `buyer_pain_hypothesis`) never appears as a fact. No public quote from the Language bank is attributed to the prospect or presented as their own words: the copy borrows the buyer's phrasing as plain wording, and it never invents a statistic.
- Confirm the signature is not baked into any email body or CSV column; it belongs on the sending-tool step (template path: in the step body; pre-written path: appended below the `{{email_*}}` variable).
- Confirm variables use `{{double_braces}}`.
- Confirm the markdown copy and YAML copy match exactly.
- Run a literal scan on final `variants.yaml` after serialization for em dashes, banned formatting/CTA/opener phrases, and unsafe phrases. If a sendable variable name reads as awkward or scraped-looking, rename the variable and update the list/enrichment schema before upload.

If a campaign needs a term that the spam checker bans, ask the user for explicit approval before using it. Otherwise, rewrite.

The house checks of Gate Requirements, the provider note and the Shared-Asset Platitude Read are in `references/copy-qa-gate.md` (house flow; see Where the rest lives, at the end).

---

## List Gate (verified slice required before any sendable copy)

The list drives the message. So this skill must not produce sendable copy or write `variants.yaml` until the **verified-list gate** passes for this campaign slice (canonical definition: `verified-list-gate.md`). All three must hold:

1. **Verified slice**: `profiles/<business-slug>/campaigns/<campaign-slug>/leads.verified.csv` exists and is non-empty (from `/email-waterfall`). **"Verified" is a hard standard, not "an email exists":** every sending email must be **third-party email-verified AND catch-all verified**, and every row must carry a **real first + last name** (the `/email-waterfall` Verification Doctrine). That standard is met EITHER by verify-first on an email the row already had (the email verifier: verify + catch-all in one call) OR by a waterfall enricher finder run (which delivers both at once). A waterfall is one valid path, not a universal requirement. Index/pattern-derived emails, fabricated-name rows, or a list that only passed a bare verifier with no catch-all check do NOT satisfy this: route back to `/email-waterfall`. Confirm `email_status = valid` on every send row (catch-all/risky live in `leads.review.csv`, never the send file).
2. **List grade:** that slice passed `/list-quality-scorecard` at grade **B or better and a list-QA PASS** (`verified-list-gate.md`).
3. **Locked strategy:** the campaign is a selected row in `campaign-strategy.md`, its `lead-source-plan.md` exists, `client-profile.yaml` `offer.lead_magnet` is locked (a real magnet, OR the `direct_offer` sentinel when the offer-first play uses a direct offer-led CTA and no magnet, per the CTA Hierarchy), and `run_state.sending_platform` is locked.

If any condition fails, **STOP**: name the failed condition and route to its producer (`/email-waterfall` → `/list-quality-scorecard`, or `/campaign-strategy` / `/lead-source-strategy`). Do not write speculative or placeholder copy "to be filled once the list is ready"; you cannot write the message before the verified list exists. Autonomy never relaxes this (it is a hard-stop in `/autonomous-execution-policy`). The only exception is an explicit operator override for a re-run on an already-verified external list.

---

## Confirmed Deliverable Gate

Before writing any CTA, confirm the prospect can receive exactly what the CTA offers after a positive reply.

**Whose yes this is (operator directive 2026-09-22).** This gate governs the **front-end** deliverable: the lead magnet, the free asset, the front-end promise. It asks one question: *can every yes this campaign will actually produce be honored as promised, on time?* Read the offer's honoring fields (`/lead-magnet-brainstorm` Save Output; for a client with per-buyer-type offer sets, the campaign's offer comes from its segment's entry in `offer.segments`):

- `lead_magnet_yes_honored_by: agency` (the default: the agency owns inboxes, sending, replies and front-end delivery; the client receives qualified conversations and delivers the paid service). The agency honors the yeses itself, including custom per-prospect work, at the volume this campaign will send. In the first wave each offer runs as an equal cell of the whole qualified TAM (`/campaign-strategy`), so this passes once the delivery path below is known and the offer's lock record carries a scale note or an `offer.qualification` rule that covers that cell's yeses (Aaron process alignment, operator directive 2026-09-22; supersedes "a test flight produces a handful to a few dozen yeses per offer"). It needs no client approval.
- `lead_magnet_yes_honored_by: client`: passes for sending only when `lead_magnet_client_ok:` is `yes`. At `pending`, write the copy like any other offer in the flight and mark that campaign Start-held: it sends only after `lead_magnet_client_ok: yes` is recorded, and until then the copy may not claim any client term the client has not confirmed (Capability Truth is unchanged, `references/hard-rules.md` rule 28). When the offer itself is the client's term (a trial, a pilot, a guarantee), the draft states it exactly as recorded in `lead_magnet_client_dependency`, and at the yes it is re-checked against the confirmed terms and re-recorded before Start if they differ. The confirmation's evidence lives in `lead_magnet_client_ok_evidence` (with `lead_magnet_client_ok_by` and `lead_magnet_client_ok_at`), written only by `outbound/scripts/offer-readiness/offer_approval.py`, never by hand. At `no` or `vetoed`, write nothing for that offer (Offer Readiness, operator decision 2026-09-28; `outbound/reference/offer-readiness.md`).

Full-volume capacity is not this gate's question. At offer lock each offer records a scale note or an `offer.qualification` rule (`/lead-magnet-brainstorm`); the winner scales to the rest of the TAM immediately, and the client's capacity answer after the test sets how many qualified yeses get the free unit per week, capping sends only where the client itself supplies the deliverable (their trial seats, their people, their stock; `/offer-test-slate` scale-review mode is a results report, never a volume gate). (Aaron process alignment, operator directive 2026-09-22; supersedes "`/campaign-strategy` sizes scaled volume to the answer".) This gate used to ask whether the agency could deliver "at reply-scale, to every positive responder", which stopped per-prospect and client-dependent offers before they were ever tested; that wording is archived at `outbound/_archive/offer-limits-removal-2026-09-22/`. Back-end product/service capability is the separate Capability Truth gate (Hard Rule 28) below. Canonical rule and the optional `service_model.front_end_owner` override: `/lead-magnet-brainstorm` references/saturation-and-scale.md, Deliverable at Send Scale (formerly Test First, Ask About Scale After).

Allowed deliverable categories:

- In-body observation: the email already contains the useful observation, and the CTA offers a short follow-on note.
- Public case study or reference: the named customer, metric, or proof point is publicly available or client-approved.
- Conversation: the sender can book a real call through the approved calendar workflow after a positive reply. It is a next step after a yes (one layer down, or on explicit booking intent), never Email 1's ask (ledger R17; operator-approved Aaron alignment, 2026-09-21).
- Company-specific note: the operator can produce the note manually or through the approved enrichment workflow.
- Confirmed asset: the client has explicitly confirmed the asset exists and can be sent.
- Client-honored offer with the client's OK on file (`lead_magnet_client_ok: yes`): the client has agreed to honor the yeses this campaign produces (a trial, product access, a term they stand behind, their people's time). A client-honored offer still at `pending` may be drafted, Start-held, but its copy claims no term the client has not yet confirmed (gate above).
- Operator-producible deliverable: the agency can produce it for every yes this campaign will produce, from data it can actually get. Per-prospect production work planned in the offer's fulfillment plan (`lead-magnets.md`) counts, and an offer the agency honors needs no client approval.

Hard stops:

- Do not promise audits, scorecards, benchmarks, ROI estimates, teardown documents, or reports until the data, method, and delivery path are confirmed. The agency confirms this itself (it knows where the data comes from and has produced one real example); the client's approval is not required for an offer the agency honors.
- If the deliverable is uncertain, fix the offer (doctrine §2); never downgrade Email 1 to a meeting ask (ledger R17). Fixing it can mean swapping in a deliverable that is confirmed; what is retired is the old fallback of downgrading the CTA to a conversation (operator-approved Aaron alignment, 2026-09-21).
- Record the deliverable category in Step 3 before writing final copy.

---

## Proof-Asset Gate (collect missing proof before writing copy that needs it)

Sibling to the Confirmed Deliverable Gate above and to Capability Truth (Hard Rule 28), and a distinct rule. Do not blur the four:

- Capability truth (Hard Rule 28): never claim a product capability the client cannot deliver.
- Confirmed Deliverable Gate: never promise a CTA deliverable you cannot fulfill after a positive reply.
- Proof-asset gate (this rule): never write copy whose credibility needs hard proof (a named client, a real case study, or an exact number) you do not have on file. Collect it first.
- **Artifact-Truth Gate** (`/lead-magnet-brainstorm`): never ship a model-generated, per-company artifact under the client's name unless its claims trace to real sources, it is framed as a work sample rather than an analysis, a human has reviewed the first 20, and it discloses what it is. **Note the axis these four split on.** The first three all test what you **say**; the fourth tests what you **hand over**, which is why it is not covered by the other three and why it needed its own gate. It fires only on per-company *generated artifacts* (an AI-built report, teardown, ABM list, sample deliverable), never on archetype K tools or on a per-contact copy line. If the campaign ships no such artifact, it does not apply.

When an angle references a named client, a case study, or an exact metric that is NOT on file (`social-proof-bank.md`, `client-profile.yaml`, `offer-intelligence.md`, an approved artifact, or the intake), be blunt about the gap and collect the real proof from the client. Check `social-proof-bank.md` first: a segment-matched `proof_status = on_file` row already carries the real result and a copy-ready `one_liner`, so the gate passes; a `gap_block` row for that segment is the gate firing (its raw-fact request may already be PENDING with the client via `/proof-asset-request` bank mode). Do not cover it with vague wording ("a leading firm", "significant results"), an unnamed stand-in where the angle needs a name, an invented number, or a silent omission. Decide the tier on one question: is the angle hollow without this proof, or just less strong?

- BLOCK (hollow without it): the angle's credibility hinges on the missing proof. Emit the fill-in form (`proof-asset-request.md`), route it to the client, and do not ship hollow copy for that angle. Switch to a different angle the on-file proof already supports, or ship the slice's offer-led version without the proof line (the offer carries it, doctrine §9) and add the proof-led angle when the proof returns. Never hold a whole slice's offer test waiting on the client's proof (operator directive 2026-09-22).
- FLAG-AND-PROCEED (would only strengthen): the copy already stands on a real signal or observation. Flag the gap plainly, emit the form, proceed with the viable version now, and upgrade the copy when the proof returns.

Not relaxed by `auto_execute`. This is a missing-source-material input gate, modeled on the List Gate, not an operator pause. The form is a data request to the client, so it is fully compatible with hands-free execution. Proceeding past a BLOCK-tier gap with hollow or invented proof is a hard-rule violation regardless of execution mode. Procedure and form template: `proof-asset-request.md`. Doctrine: memory.

**Where the form goes (operator decision 2026-09-28).** The form is never a message of its own. The main session merges it, as one numbered `FEEDS` item with its fields indented beneath it, into the client's one unsent message, `profiles/<business-slug>/client-asks.md` (`outbound/reference/client-messages.md`). Claude drafts that file and never sends it; the operator does.

---

## Compliance: the opt-out ruling (Step 1, item 0a)

Other skills cite this item as Step 1, item 0a. It binds every path, so it lives here. The rest of Step 1 is house flow (`references/house-flow.md`).

0a. **Opt-out ruling for Canada, the UK and Ireland (added 2026-09-24).** FNNL's default is unchanged: no opt-out line in the email body (the kill-list above), with the opt-out carried by the one-click List-Unsubscribe header that `/cold-email-kickoff` Gate C requires. But when the target geography includes Canada, the UK or Ireland (`icp_hard_filters.countries` holds `CA`, `GB` or `UK`, or `IE`, or `lead_sourcing.target_geography_notes` or the campaign's own geography names them), confirm a per-client opt-out ruling is recorded in `client-profile.yaml` under `capability_boundary.legal_or_compliance_limits`. Canada's anti-spam law (CASL) and the UK and Irish e-privacy rules (PECR in the UK) generally expect a commercial email to identify the sender and carry a working way to opt out, and CASL also sets its own consent conditions. With no ruling on record, ask the operator once and hold the copy until it is recorded, under `auto_execute` too, because it is a legal-risk call. The ruling may be that the default stands (the header alone), a plain-text opt-out line in the body, or a visible unsubscribe link (check how the locked sending platform renders one, since some platforms need HTML for it). A body opt-out line the ruling requires is a compliance line, not a closeout: the legal-requirements-override-style rule (Hard Rule 23) covers it, and it is recorded under Compliance as a compliance requirement, not a style choice. Carry the ruling into `copy.md` under Compliance. This is a compliance flag, not legal advice.

---

## variants.yaml Requirement

After presenting the markdown-formatted copy, also write a machine-readable `variants.yaml` to:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/variants.yaml
```

The YAML body content must match the markdown body exactly:

- same words
- same variables
- same line breaks
- same subjects
- same sequence order
- same approved variants

Before writing YAML, run the Copy QA Gate again against every YAML `subject` and `body` field. After writing YAML, re-open the raw `variants.yaml` file and scan the serialized text exactly as the upload tool will read it. If serialization, variable names, escaping, comments, or copied metadata introduce banned wording or em dashes into sendable subjects or bodies, fix the YAML or the markdown so they match exactly and pass.

### Schema

```yaml
name: "<campaign name>"
schedule:
  timezone: America/New_York
  days: [1, 2, 3, 4, 5]
  start_hour: "08:00"
  end_hour: "17:00"
  min_time_btw_emails: 10
  max_leads_per_day: 30
inbox_selection:
  tag: active
  count: 20
sequences:
  - step: 1
    delay_days: 0
    variants:
      - label: A
        subject: "<QA-approved subject>"
        body: |
          <QA-approved body, the control>
      - label: B
        subject: "<same QA-approved subject>"
        body: |
          <QA-approved body, one variable changed against A>
      - label: C
        subject: "<same QA-approved subject>"
        body: |
          <QA-approved body, one variable changed against A>
  - step: 2
    delay_days: 3
    variants:
      - label: A
        subject: ""
        body: |
          <QA-approved body>
  - step: 3
    delay_days: 3
    variants:
      - label: A
        subject: ""   # threaded follow-up, no subject; a planned new-thread arm lives in copy.md until an upload path wires it (Hard Rule 18)
        body: |
          <QA-approved body>
```

Step 1 carries three variants by default (A, B, C; add D and on only when a test needs them), all with the same subject so the body is the isolated variable, and every `- label:` sits at the same six-space indent, because the sequence DOCX builder only picks up labels at that indent. Step 3 exists only in a genuinely small market (roughly under 3,000 qualified contacts) or as a tested arm. `schedule.days: [1, 2, 3, 4, 5]` is Monday to Friday, the default sending week (Tue to Thu only as a tested variant or for a tiny TAM). (Aaron process alignment, operator directive 2026-09-22.)

**Cadence (Aaron process alignment, operator directive 2026-09-22; judgment call, logged).** Two emails by default at every TAM size; a third only in a genuinely small market (roughly under 3,000 qualified contacts, a house threshold) or as a tested arm (supersedes the sequence-length-by-TAM table). Cadence Day 0 and Day 3; when a third runs, Day 0, 3, 6. `delay_days` is read here as the wait after the previous step, so step 3's value moved from 7 to 3 to make the day labels and Aaron's 2-to-3-day gap agree. That per-step reading is not yet verified on FNNL's own sending platform: confirm on the first upload that the locked sending platform (`run_state.sending_platform`) treats the value as a per-step wait rather than a delay from Day 0, and if it counts from Day 0, write 3 and 6 instead.

The sequence is one thread: step 1 (Email 1) is the new thread with a non-empty subject; steps 2 and 3 (the follow-ups) are threaded replies with empty subjects. If the sending platform supports explicit threading metadata, mark steps 2 and 3 as thread replies and step 1 as the new thread. There is no step 4 (Hard Rule 18). A final follow-up planned as the logged new-thread arm (Hard Rule 18) is written in `copy.md`, not in this file, because no upload path in this workspace wires a non-threaded final step yet; `variants.yaml` carries the threaded version that ships.

The literal `subject: "..."` shown above is the live rule for both template and pre-written paths. Email 1 uses one shared subject template for the whole campaign or offer-angle slice, on every Email 1 variant. It must contain 2 to 4 lowercase words and 0 to 2 variables (operator-approved Aaron alignment, 2026-09-21; doctrine §9). Do not generate per-contact subject columns. Email 2 and optional Email 3 inherit the thread and carry no subject.

Do not write YAML that contains unapproved copy, placeholder copy, failed copy, or copy that differs from the reviewed markdown.

YAML body format must use block scalar syntax (`body: |`) with 10-space indented content. Inline escaped strings (`body: "line1\nline2"`) are not parsed correctly by the scripts that read `variants.yaml` line by line (for example `scripts/campaign_docx_presentation.ps1`, the sequence DOCX renderer) and must not be used.

---

## copy.md Requirement

After writing `variants.yaml`, also write a human-readable `copy.md` to:

```text
profiles/<business-slug>/campaigns/<campaign-slug>/copy.md
```

`copy.md` is the canonical human review record for the campaign. It is not generated from `variants.yaml`: it contains everything needed to review, edit, brief, or re-deliver the campaign without opening the YAML.

`variants.yaml` is the machine upload format. `copy.md` is the human review format. Both must exist for every campaign. They must match on all body copy, subjects, and variables.

### Required sections in copy.md

```markdown
# Campaign Copy - <Campaign Name>

**Date:** <YYYY-MM-DD>
**Campaign:** <Campaign name>
**ICP:** <Target titles, company type, size, geography>
**Lead magnet:** <What is offered and how it is delivered. Reference lead-magnets.md.>
**Research basis:** <the offer arm's `pain_angle`; the cluster IDs (`_research/pain-clusters.md`) and the Language-bank phrases the copy used, each phrase with its evidence ID; any pain, objection or workaround line phrased as a question because no cluster backs it; "no pain line" when the copy carries none>
**Tone:** <casual / peer-to-peer / formal>
**Sending platform:** <the locked `run_state.sending_platform` value, resolved from the stack contract>
**Shape and labeled variants:** <one-liner or two lines plus a P.S. (the ledger R14 A/B pair); every labeled variant run as a logged test arm or awareness-driven choice, and why; "none" if none>
**Compliance:** <any sender identification a client's counsel or the recipient's jurisdiction requires in the signature (for example a postal address), and its source; "none" if none. Then the opt-out ruling: FNNL's default (no opt-out line in the body; the one-click List-Unsubscribe header, `/cold-email-kickoff` Gate C), or the client's own ruling, which must be on record when the geography includes CA, GB/UK or IE (Step 1, item 0a)>
**Personalization rung:** <`personalization_rung`: the slice's shared body, varying per row by `{{first_name}}` and at most two per-contact variables inside the offer sentence (name them, their source column, and the approved no-variable body for rows missing a value), plus the first-20 review result (Hard Rule 34)>
**Email 1 variants:** <A = control; B = the one variable it changes; C = the one variable it changes; any further letter and why>
**Reply path:** <offer type (promised asset, or direct / trial / service), the reply rule it gets (Hard Rule 36), and `offer.qualification` when one applies>
**Sequence:** <2 steps, or 3 with the reason (small market with its qualified-contact count, or the tested arm); whether a final follow-up is planned as the logged new-thread arm (planned only; the threaded version ships until an upload path wires it)>

---

## Sequence Structure

<Table: Step | Thread | Angle tested>

---

## Spam + Best-Practices QA Notes

<Inline notes confirming which banned tokens were specifically avoided, formatting rules confirmed, CTA rules confirmed. Campaign-specific, not a generic list.>

---

## Variables

<Table: Variable | Source | Example value>

### AI variable prompt for `{{variable_name}}`
<If any variable is AI-generated, include the exact prompt the Claude Code sub-agents ran to generate it (AI generation happens only in Claude Code; list-workbench AI columns are banned on every key, and results reach the workbench by webhook) and the first-20-review instruction. For the pre-written copy path, this is the full per-contact email body prompt from `/personalization-subagent-pattern`.>

---

## Email 1 - Day 0 (New Thread), Thread 1: <Angle name>

### Subject Line Options
1. `subject-a`
2. `subject-b`
3. `subject-c`   ← show 2-3 options per new-thread email

---

**Variant A** (~XX words) - control: <angle description>
[copy block]

**Variant B** (~XX words) - changes one variable against A: <which one>
[copy block]

**Variant C** (~XX words) - changes one variable against A: <which one>
[copy block]

<further letters only when a test needs them, one variable each>

<if the body uses a per-contact variable: the approved no-variable version of each variant, for rows missing a sourced value>

---

## Email 2 - Day 3 (Same Thread, No Subject), 2 to 3 days after Email 1: <direction: strip back / different value prop or mechanism / add to it>

<the single follow-up body with its word count>

---

## Email 3 - Day 6, 2 to 3 days after Email 2 (small market or tested arm only): <direction>

<the single follow-up body with its word count; Same Thread, No Subject by default. Only when it is planned as the logged new-thread arm, add its own 2-to-4-word lowercase subject here, name the arm, and note that the threaded version ships until an upload path wires a non-threaded final step>

---

## (No Email 4: the 4-email / two-thread structure is retired 2026-07-05)

---

## QA Checklist

### Spam-word check
- [ ] <each relevant banned token confirmed absent, campaign-specific>
- [ ] No em dashes - confirmed
- [ ] No space-hyphen-space mid-sentence separators - confirmed
- [ ] No colon before a list inside a single sentence - confirmed
- [ ] No comma-wrapped company descriptors - confirmed
- [ ] Banned CTAs absent - confirmed

### Best-practices check
- [ ] <the rows of this check are in `references/copy-qa-gate.md`, section "copy.md template: the Best-practices check rows"; read them when writing `copy.md`. In recorder mode they are a record, not a gate: fill each row with pass, or "departs (Aaron)" and his reason, and never change his copy to pass one (`aaron-lane.md`, What now yields to Aaron)>

---

## Scoring (Email 1, Variant A)

| Dimension | Score | Notes |
|---|---|---|
| Relevance | /25 | |
| Value clarity | /25 | |
| Proof quality | /15 | |
| CTA friction | /15 | |
| Readability | /10 | |
| Deliverability | /10 | |
| **Total** | **/100** | Ready / Revise |

---

## Sequence Summary

<Table: Step | Thread | Day | Subject | Angle | Variants | Words>
```

Do not write a `copy.md` that omits the QA checklist, scoring, or sequence summary. Do not write a `copy.md` that contains copy not in `variants.yaml` or omits copy that is in `variants.yaml`.

---

## Spintax Rules

Use spintax only after final copy is approved.

- Every branch must pass `spam-word-checker.md`.
- Every branch must preserve the same meaning.
- Do not create so many branches that quality becomes uneven.
- Do not spin variables into broken grammar.
- **No spintax on any Email 1 variant column** (`email_1_a`, `email_1_b`, `email_1_c`, and any further declared letter). Each variant is fixed per row at build time and changes exactly one variable against A, so spinning it would blur the one-variable test the three variants exist to run. Spintax may apply to the shared follow-up text (`email_2`, optional `email_3`) only, in the locked sending platform's own variation syntax, and never to an `{{email_*}}` token itself or the signature (Aaron process alignment, operator directive 2026-09-22).

After spintax is added, rerun the Copy QA Gate.

---

## What To Do Next

**Neither menu is asked, in any mode (plain-text outputs, operator decision 2026-09-28).** `variants.yaml` and `copy.md` in the client's profile folder are the copy deliverables. A DOCX pack is made only when the operator asks for one in chat, and the approval brief only when the operator asks for it (Markdown by default, see `/campaign-approval-brief`). Under `auto_execute` the run continues straight to spintax (`/phase-4-copy-launch` step 4), then the upload stop (step 6) and the paused drafts (step 7).

The DOCX-pack and approval-brief menus this refers to moved verbatim to `references/policies-and-related-skills.md`. They run only once the operator has asked.

If copy is approved, resolve the sending platform: read `run_state.sending_platform` from the profile or campaign plan, and if that slot is empty or missing there and in the stack contract, STOP and route to `/stack-setup`. Then run the variation and upload steps below in that platform's own syntax and import format. This skill ships no platform-specific upload workflow and names no default platform: the serialization details belong to whichever tool fills the sending-platform slot.

| Step | What runs for the locked `run_state.sending_platform` |
|---|---|
| 1. Variation | that platform's native spintax/variant workflow, written in that platform's own variant syntax, on the follow-up text only (never on an Email 1 variant column; Spintax Rules) |
| 2. Upload | that platform's native campaign-upload workflow, in that platform's own import format (custom-field naming, variant slots, body/HTML shape), with one Email 1 variation per declared column (`email_1_a`, `email_1_b`, `email_1_c` by default) on an even split, stopping rather than dropping Variant C (Split testing, above), and the schedule Monday to Friday |

Inside a phase run, step 1 is `/phase-4-copy-launch` step 4 (spintax) and step 2 is its step 7 (paused drafts, built only after the step 6 upload stop clears). The upload creates paused drafts only: pressing Start is always the operator's.

What the upload wiring cannot do yet: no upload path in this workspace wires a non-threaded final step, so a new-thread final follow-up arm stays planned in `copy.md` and the threaded version ships (Hard Rule 18). (Aaron process alignment, operator directive 2026-09-22.)

Never suggest or assume any platform other than the one locked in `run_state.sending_platform`. Only ask to change platforms if the locked path is impossible or the user explicitly asks.

If copy fails QA, rewrite through this skill before moving forward.

## Where the rest lives

Every section below was moved verbatim (wording and numbering unchanged, apart from the dated port edits each file's first line names) into a file in `references/` in this skill folder. Read a file only when its trigger applies:

- **H (house):** only when the operator asks for the house copy flow (the stepwise direction rounds and style gates), or to look up a house default Aaron departed from. Its output goes to Aaron, who still decides.
- **C (cited):** when another skill, a check or a rail cites the rule by name or number, or when copy is written outside the Aaron lane (for example `/lifecycle-copy`).
- **R (render):** when the per-row `email_*` columns are rendered or the upload to the sending platform is built.
- **S (signal):** when a campaign slice rests on a signal or carries a slice-shared signal fact.

Two headings repeat. "QA Checklist" appears three times: inside the `copy.md` template (in this file), inside Step 4's output template (`house-flow.md`) and as a standalone section (`copy-qa-gate.md`). "Step 1" appears twice, as "Step 1: Confirm Campaign Direction" and the fenced "Step 1: Campaign Direction" template inside it, both in `house-flow.md`; its item 0a is in Compliance, above.

| Section | File | When |
| --- | --- | --- |
| The stepwise direction rounds and style gates, as a whole | `house-flow.md` (Steps 1 to 4), `copy-qa-gate.md`, `framework-a-offer-first.md` | H |
| Required Guardrails | `house-flow.md` | H |
| How This Skill Works | `house-flow.md` | H |
| Input Sources | `house-flow.md` | H (its `client-intel.md` bullet is in Client intel read, above) |
| Offer Architecture (complete before writing Email 1) | `house-flow.md` | H, C |
| Step 1: Confirm Campaign Direction (What To Do Silently, including item 5a's direct, close and no match proof tiers; What To Present) | `house-flow.md` | H, C |
| Step 2: Confirm Subject Line And First-Line Strategy (Strategy Types; What To Present) | `house-flow.md` | H |
| Step 3: Confirm Body Structure (What To Decide; What To Present) | `house-flow.md` | H |
| Step 4: Output Final Copy (Output Format, holding "Final Campaign Copy") | `house-flow.md` | H |
| Final Reminders | `house-flow.md` | H |
| Framework A: the Email 1 hard structure (HARD RULE, 2026-08-12) | `framework-a-offer-first.md` | H, C |
| Offer-First Copy Standard (Aaron method): the default for cold copy (holds "Write FOR the real list", "The number goes IN the offer" and the 13 Questions Gate) | `framework-a-offer-first.md` | H, C |
| The CTA Hierarchy: offer-first, lead magnet optional, rotate across steps (holds The Delivery Message) | `framework-a-offer-first.md` | H, C |
| Copy QA Gate (house checks): Gate Requirements (house checks) and the provider note | `copy-qa-gate.md` | H, C |
| Shared-Asset Platitude Read (forced pass, before lock) | `copy-qa-gate.md` | H |
| copy.md template: the Best-practices check rows | `copy-qa-gate.md` | When writing `copy.md` (the rows belong to its template) |
| QA Checklist (the standalone section) | `copy-qa-gate.md` | H |
| Scoring Rubric | `copy-qa-gate.md` | H |
| Pre-Written Email Copy Architecture | `prewritten-columns.md` | R, C |
| The core shift; Per-contact rows (one shared body per slice); Column naming convention | `prewritten-columns.md` | R |
| Sending-tool variable usage and signature; Split testing: within-campaign variants (preferred where the platform supports them) or across campaigns; Export gate | `prewritten-columns.md` | R, C |
| Hard Rules 1 to 39 | `hard-rules.md` | C (the gates here cite Hard Rules 23 and 28) |
| Hard Rule 18 (single thread, 2 to 3 steps) | `hard-rules.md` | C |
| Hard Rule 19 (the offer-led opener) | `hard-rules.md` | C |
| Hard Rule 27 (the Framework A default anatomy) | `hard-rules.md` | C |
| Hard Rule 32 (make yes the easy answer; the CTA whitelist) | `hard-rules.md` | C |
| Hard Rule 34 (one shared body per slice) | `hard-rules.md` | C, R |
| Hard Rule 36 (the reply after a yes) | `hard-rules.md` | C |
| Hard Rule 38 (competitor names and public complaints stay slice-shared) | `hard-rules.md` | C |
| Core Copywriting Framework (Philosophy) | `frameworks-and-strategy.md` | H |
| AI Personalization Decision Framework | `frameworks-and-strategy.md` | H, C |
| Offer Framework | `frameworks-and-strategy.md` | H |
| Variable Schema (Core Variables; High-Signal Variables; Per-Contact Copy Variables; AI-Generated Variables; Proof Variables; Formatting) | `frameworks-and-strategy.md` | H, C, R |
| Email Structure (Target Length; Structure; Layout; Signature) | `frameworks-and-strategy.md` | H, C |
| Subject Line Strategy | `frameworks-and-strategy.md` | H |
| Opener Strategy | `frameworks-and-strategy.md` | H |
| Opener Framework (Email 1 and Email 3) | `frameworks-and-strategy.md` | H |
| Human Voice, Not Fake Warmth (Hard prohibition; The said-out-loud test; Where the voice lives; The two levers; Email 1 examples; Follow-up examples; Reconciling with the offer-led opener; Discipline) | `frameworks-and-strategy.md` | H, C |
| CTA Strategy | `frameworks-and-strategy.md` | H |
| Follow-Up Sequence Framework (Email 1 - Thread 1 New Thread; Email 2 - Thread 1 Support; Email 3 - Third Follow-up; No Email 4) | `frameworks-and-strategy.md` | H, C |
| Split Testing Rules | `frameworks-and-strategy.md` | H, C |
| Signal-First Opener Rule (RETIRED 2026-07-17) | `signal-angle-library.md` | S |
| Signal-First Anti-Patterns: the six ways a line leaks the signal | `signal-angle-library.md` | S, C |
| Signal Angle Library | `signal-angle-library.md` | S, C |
| Retired opener templates (archived, not to be sent) | `signal-angle-library.md` | S |
| Material Decision Rule | `policies-and-related-skills.md` | At a material fork in this skill |
| Interaction Policy (full text) | `policies-and-related-skills.md` | Before an `auto_execute` or `review_gates` decision |
| What To Do Next: the DOCX-pack and approval-brief menus | `policies-and-related-skills.md` | When the operator asks for a DOCX pack or the brief |
| Related Skills | `policies-and-related-skills.md` | When you need the skill that owns a neighbouring step |
