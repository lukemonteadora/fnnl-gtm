# Offer Readiness

**What this is.** A rail around Aaron's offer call, not a second opinion. For every offer being tested, one generated screen shows:
- the offer and who delivers it;
- whether the client has said yes, and on what evidence;
- the real sample;
- what is missing and from whom;
- the next action and its owner.

Ported from the upstream workspace on 2026-09-28, where it was piloted on one live client and the operator approved the seven decisions below the same day. The scripts keep their upstream behavior; only wording, paths and tool references changed. Every tool is named here by its capability role (the sending platform, the reply inbox, the email verifier), never by brand, per `CLAUDE.md` section 1.

## The rules

- **One approval source of truth.** `lead_magnet_yes_honored_by` and `lead_magnet_client_ok` stay the only approval values. There is no new status field and no new gate.
- **Agency offers need no approval.** An agency-honored offer is `not_needed` and never gets evidence fields filled.
- **A pending arm is drafted like any other, and only Start is held** (decision 1). It gets its list, copy and a paused campaign, and it counts toward the offer count. It sends only at `yes`, never on silence. A `no` (or `vetoed`) arm is never built.
- **Capability Truth is unchanged.** Copy may claim a client term only once it is confirmed and written into `lead_magnet_client_dependency` with `lead_magnet_client_ok: yes` (`/campaign-copywriting` Hard Rule 28). A Start-held draft is never seen by a prospect, so it carries no live unconfirmed claim. When the offer itself is the client's term (a trial, a pilot, a guarantee), the draft states the term exactly as recorded in `lead_magnet_client_dependency`. At the yes, compare the confirmed `--terms` with the drafted copy. If they differ, the copy is re-recorded (Aaron's words, only the term slot changes) before Start.
- **Capacity is requested, not trimmed** (decision 2). The weekly cap lives only in its existing homes, and there are no other cap fields:
  - `qualification.free_unit_cap_per_week` (how many free units a week);
  - `scale_review.confirmed_capacity_per_week`, which caps sends only where the client supplies the deliverable (the carve-out in `/campaign-strategy`).

  The per-offer `capacity` block holds arithmetic only.
- **Aaron decides offers and copy.** Any new prospect-facing line (an FAQ answer, an over-cap reply) goes to a fresh `/ask-aaron` sub-agent, never house copy (decision 5, `aaron-lane.md`). The operator outranks him.
- **Nothing sends on its own.** The client message is a draft that the operator sends. Reply agents and AI reply features in the reply inbox on the sending platform stay the operator's to set up and switch on.

## Stored fields (per offer, in every mirror of it)

One offer is stored up to four times: the top-level `offer` block mirrors the priority-1 segment, and each `offer.segments[]` entry carries its own primary and arms. Every field below sits in every mirror, and the scripts write all mirrors together.

| Field | Meaning | Written by |
|---|---|---|
| `aaron_rank` | The offer's rank in Aaron's offer call (1 is the primary of the priority set). It is the key every script and every client-message item (`[offer-<rank>]`) uses. It is not `validation_arms[].rank`, which numbers the arms only; both stay. | Recorder at lock (`aaron-lane.md`) |
| `lead_magnet_client_ok_by` | Who gave the yes or no | `offer_approval.py set` only |
| `lead_magnet_client_ok_at` | When they answered (not when we asked) | `offer_approval.py set` only |
| `lead_magnet_client_ok_evidence` | Slack permalink, email id or meeting note | `offer_approval.py set` only |
| `delivery_mode` | `agency`, `client_input`, `client_delivers` or `call_only`: a detail of `lead_magnet_yes_honored_by`, never a contradiction of it | Recorder at lock |
| `capacity` | The arithmetic only: planned first touches a week, a labelled GUESS positive-reply rate with its source, expected yeses, who fulfils, turnaround, and a `cap_note` naming where the cap lives | Recorder at lock, updated when the client answers |
| `sample` | `path`, `account`, `prepared`, `missing`, `reviewed_by`, `provisional_reason`. No stage value: DRAFT or reviewed is derived from the file and `reviewed_by` | Phase 4 step 2 |
| `qualification.free_unit_cap_per_week` | Existing field (`/lead-magnet-brainstorm` Save Output). The migration adds it as `null` wherever a `qualification` block is defined in place and lacks it, and YAML aliases inherit it | `/offer-test-slate` scale review |

The three evidence fields are `null` at lock (decision 7). **Layout contract:** in every mirror they sit on the three lines directly after `lead_magnet_client_ok:`, in the order `_by`, `_at`, `_evidence`, at the same indent, with no comment line between. `offer_approval.py` refuses any other layout, and `readiness_fields.py` inserts them that way.

**Match the approval key with its colon** (`lead_magnet_client_ok:`). Without the colon, a search also hits the three prefixed evidence keys. Every script and every instruction that locates the approval value uses the colon.

No existing field is renamed. The layer only adds the fields above beside the ones `/lead-magnet-brainstorm` and `/offer-test-slate` already write, and it never touches `run_state`.

## Scripts (`outbound/scripts/offer-readiness/`)

All of them edit or read the profile as text where they write, so comments, YAML anchors and line endings survive (a PyYAML dump would destroy them). A profile with no Aaron-lane offer (no `aaron_rank` beside `lead_magnet_client_ok`) makes every script report "not applicable" and change nothing. They need Python with PyYAML and make no network calls.

```
python outbound/scripts/offer-readiness/readiness_fields.py <client-profile.yaml> [--values <json>] [--dry-run]
python outbound/scripts/offer-readiness/offer_approval.py set <client-dir> <aaron_rank> yes --terms "<exactly what the client confirmed>" --by "<who>" --evidence "<permalink|email id|meeting note>" [--at YYYY-MM-DD] [--dry-run]
python outbound/scripts/offer-readiness/offer_approval.py set <client-dir> <aaron_rank> no --by "<who>" --evidence "<...>" [--at YYYY-MM-DD] [--dry-run]
python outbound/scripts/offer-readiness/build_readiness.py <client-dir> [--check]
python outbound/scripts/offer-readiness/build_reply_playbook.py <client-dir> [--check]
python outbound/scripts/offer-readiness/verify_readiness.py <client-dir> [--baseline <older profile>] [--allow-changed <key> ...]
```

`<client-dir>` is `outbound/profiles/<slug>`.

- **`readiness_fields.py`: a one-time, idempotent migration.**
  - It adds the evidence trio (`null`) and `delivery_mode` (`agency` for agency offers, otherwise `null` until the recorder sets it) under every `lead_magnet_client_ok:` line.
  - It adds `free_unit_cap_per_week: null` under every `qualification` block defined in place that lacks it.
  - `--values` (JSON keyed by `aaron_rank`) can also supply `delivery_mode`, `capacity` and `sample`.
- **`offer_approval.py`: the only approval writer.** It updates every mirror and logs to `activity-log.md`.
  - **On a yes:** `--terms` is required and replaces `lead_magnet_client_dependency` with `CONFIRMED <date>: <terms>`.
  - **On a no for an arm:** it sets the arm's existing `status: vetoed`, appends it to `test_slate.vetoed_offers` and sets `test_slate.client_response: vetoed_some`.
  - **On a no for the primary:** it never auto-promotes. It prints and logs the follow-on: the recorder re-records the offer block under Aaron's call, and a client no reopens a frozen Phase 2.
  - **It refuses:** agency offers, empty evidence, a yes without terms, a bad date, an unknown rank, disagreeing mirrors, a profile not yet migrated, and block-scalar dependencies.
- **`build_readiness.py`: writes the generated views.**
  - It reads caps from their existing homes and each offer's send date from `client-asks.md` (`client-messages.md`).
  - `--check` exits 1 when the views are stale. It ignores the generated header and the `Regenerated <date>` lines, so a new day or an unrelated profile write does not read as stale.
- **`build_reply_playbook.py`: writes each campaign's reply notes as one `## Notes` block and compiles `reply-playbook.md`** (see Reply notes below).
- **`verify_readiness.py`: the audit.** It checks:
  - the board against the profile, current views and no mirror drift;
  - samples or stated blockers;
  - one message path;
  - reply-notes coverage and parser safety;
  - the evidence trio on every mirror, no retired or status-like fields, and the cap key in every qualification block;
  - line endings not mixed;
  - with `--baseline`, that the profile only gained lines.

  It is the check behind the Offer test slate row (C2) of `/cold-email-flow-audit`.

Tests: `outbound/scripts/offer-readiness/tests/test_offer_readiness.py` builds a synthetic client in a temp folder and runs the migration, both builders, the approval writer and the audit.

## Generated views (read-only, never hand-edited)

- **`offers/_readiness-board.md`:** one row per offer, with mirrors deduped and checked for drift. Each row shows the Start rail, the sample, expected yeses, the cap in force, missing items, the next action and its owner. Below the table sit the pending approvals with their 48-hour nudge drafts.
- **`offers/<offer>/readiness.md`:** the same for one offer, in full.
- **`reply-playbook.md`:** every campaign's reply notes with an overview table on top, for the operator to paste into a reply agent in the reply inbox on the sending platform (its unibox) himself.

## The client ask (decision 3)

The offer asks are items in the client's one unsent message, the `## Current message` of `client-asks.md`. How that message is written, merged, filed once sent and archived is `client-messages.md`. Phase 2 step 8 merges the offer items into it when an arm is pending or an input is missing. There is no separate ask-draft file.

- **The offer items:**
  - one yes or no per offer that needs the client, keyed `[offer-<rank>]` (the offer's `aaron_rank`), class `BLOCKS-START`;
  - the missing inputs an offer cannot run without;
  - one rough capacity question;
  - a mention of the sample when one exists (samples are built in Phase 4, so Phase 4 step 2 merges it in while the message is unsent);
  - at most one line on doing more if the test works.
- **Style:** casual, no spaced em dashes, a draft only.
- **The 48-hour clock** runs from the newest sent message carrying the offer's key, else from the current message's `Sent:` line (`client-messages.md`).
- When the client answers, each yes or no goes through `offer_approval.py`, and capacity goes into `scale_review.confirmed_capacity_per_week` or `qualification.free_unit_cap_per_week`.

## The 48-hour follow-through

Pending arms whose ask was sent 48 or more hours ago (a GUESS default) are listed, each with a one-line nudge draft for the operator. They appear:
- at every checkpoint;
- in every `/continue-client` run;
- in every `/cold-email-weekly-rhythm` pass.

If the ask was never sent, the board says "no clock is running". Silence never sends anything and never counts as a yes. The client intel feed (`client-intel-feed.md`) never sets `yes`: what someone said in a meeting or in Slack is a hypothesis until the operator records it through `offer_approval.py`.

## Samples (decision 4)

Phase 4 step 2 builds one real sample per offer, next to the agency assets that step already drafts.
- **Where:** on a row from `leads.verified.csv`, after the email verifier of record (`lead_data.email_verification` in `stack-contract.yaml`) has checked it (`verified-list-gate.md` condition 1). Never at the 25-account list QA, where no email is verified yet.
- **Status:** it stays DRAFT until reviewed, and is recorded in the offer's `sample:` block (with `reviewed_by` set once reviewed).
- **Truth:** a model-built sample must pass the Artifact-Truth Gate (`/lead-magnet-brainstorm`).
- **When there is none:** an offer with no sample states its blockers in `sample.missing`.

## Reply notes (decision 5)

What the layer adds to replies goes into `campaigns/<slug>/interested-reply.md` as one `## Notes` block. It holds:
- what counts as a yes;
- turnaround;
- the fulfillment handoff;
- the call brief;
- Aaron's FAQ lines;
- never-claim;
- hand-to-human triggers.

**Parser safety.** `outbound/scripts/lifecycle_docx_presentation.ps1` turns every `## ` heading other than When to Use, Notes, Call Script and Confirmation Page into an email step, and prints Notes lines as plain text. So the block uses plain `- Label: text` lines, no bold labels, and adds no other heading. The generated lines sit between two sentinel lines inside the file's `## Notes` section, so a hand-written note there survives a regeneration.

**Placement.** Until Phase 4 writes `interested-reply.md`, the block is staged in `offers/reply-notes/<slug>.md`. The script never creates `interested-reply.md` itself, and it deletes the staged file once the block lives in `interested-reply.md`, so two copies cannot drift.

**Where the words come from.** Everything client-specific comes from `profiles/<slug>/offers/reply-notes.json`. Its prospect-facing lines (the yes-reply, FAQ answers, any over-cap reply) are Aaron's words from a fresh `/ask-aaron` call, recorded word for word. The yes-reply is his delivery frame DR. A wave campaign with no entry gets a "Needs Aaron" placeholder, never house copy.

The file's shape (strings may use `${slot}` fills per campaign):

```json
{
  "wave": 1, "version": "v1",
  "what_counts_as_yes": "...",
  "faq_source": "Aaron's lines, <file>", "faq_rule": "...",
  "over_cap": "...", "playbook_status": "...",
  "never_claim": ["..."], "handoff_triggers": ["..."],
  "offers": {"1": {"vars": {"dr": "Here's a link to ${thing}. [link] ..."}, "after_yes": "...",
                   "yes_reply": "...", "need": "...", "turnaround": "...", "handoff": ["..."],
                   "link_status": "...", "call_brief": "...", "faq": [["question (frame)", "answer"]]}},
  "campaigns": {"<campaign-slug>": {"offer": 1, "vars": {"thing": "...", "vertical": "..."}, "link_status": "..."}}
}
```

A campaign belongs to an offer when its `leads.verified.csv` carries an `offer` column naming that offer's `aaron_rank`, or when `reply-notes.json` lists it under `campaigns`.

**Reply-agent threshold (decision 6).** Draft-and-approve until 80% of an agent's first 50 drafts go out with light or no edits. Fully automatic sending always needs the operator. The playbook is a paste view: Claude never creates or edits a reply agent from it. Whether the locked sending platform's reply inbox offers a reply agent at all is a question for `stack-contract.yaml`; if it does not, the playbook is the SDR's script and nothing else changes.

## Where it runs

- **Phase 2 (`/phase-2-research-offer`).** The recorder writes the fields at lock (`/lead-magnet-brainstorm`). Step 8 merges the offer items into the current message of `client-asks.md` (`client-messages.md`). Then run `readiness_fields.py` if the fields are missing, and `build_readiness.py`. Checkpoint A shows the board: display only, no new question.
- **Phase 4 (`/phase-4-copy-launch`).**
  - Step 2 builds the samples.
  - Step 3 runs `build_reply_playbook.py` after the reply files.
  - Gate C (`/cold-email-kickoff`) shows the Start rail per arm from the board.
  - `verify_readiness.py` runs before the launch review.
- **Every resume and weekly pass.** `/continue-client` and `/cold-email-weekly-rhythm` show the pending approvals and nudges.
- **Frozen phases (`phase-protocol.md`).** Writing evidence or a client `yes` through `offer_approval.py` is not a reopen. A client `no` is one. The `readiness_fields.py` backfill is evidence-only. Setting a cap value or adding samples to a frozen phase needs the operator's breaking mark.

## Backfill

Backfill applies only to clients that have not pressed Start. Live clients get only a board row for client-honored arms with no evidence, and nothing is paused.

At port time (2026-09-28) no FNNL profile carries `aaron_rank`, so there is nothing to migrate: running the scripts on any existing client reports "not applicable" and changes nothing. The fields arrive when the recorder locks an offer through the Aaron lane (`aaron-lane.md`).
