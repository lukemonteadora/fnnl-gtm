# Client messages (`client-asks.md`)

The one home for how a client's asks are written, merged and filed (operator decision 2026-09-28). Every skill that asks a client for something points here in one line; this file holds the rule.

`profiles/<slug>/client-asks.md` holds **at most one unsent message** to the client: one greeting, one numbered list, one sign-off, one `Sent:` line. The operator sends it, or the teammate the operator names. **Claude never sends it:** it never emails it, never posts it to Slack or any other channel, and never shares a linked sheet or doc with the client. It drafts the file and stops.

**When it is written.** The message is drafted at checkpoint 1 and updated at checkpoints 3 and 4 (`/cold-email-kickoff`, "Client asks never hold the flow"; `phase-protocol.md`). Any skill with a client ask in between (for example `/social-proof-bank`'s proof request, or `/proof-asset-request`) merges into the same message. Client asks never hold the flow: only the one thing that cannot happen without the answer waits, as each class below says. The message asks only what blocks a launch (the ask policy, `phase-protocol.md` section 3; "Writing the message" below), and the operator's pasted answers are filed as "Filing the answers the operator pastes back" says.

## Layout (in this order)

1. **`## Current message`.** First line `Sent: not yet`. Then the message as a blockquote. Then a `What each unblocks:` list, which is ours and never part of the message: one line per item, `- <n> [<key>] <CLASS>: <what it unblocks>`. When nothing is unsent, the section reads `Nothing unsent.` and has no `Sent:` line.
2. **`## Internal`.** Items owed by our own side (the account manager, the operator, the list builder). One bullet each, starting with the owner's role. Also the items the question filter kept out of the message ("Writing the message", section 2), one bullet each: `Not asked: <item>, <reason>`. Never written as a second message.
3. **`## Sent`.** Each sent message under its own `### Sent YYYY-MM-DD` heading, verbatim, newest first, with its unblocks list and without its `Sent:` line. The only line-start `Sent:` in the file is the one inside `## Current message`.

A short "What this is" line may sit under the file title. Nothing else goes in the file.

## Item classes and keys

Every item carries exactly one class:

- **`BLOCKS-UPLOAD`:** a do-not-contact list, a suppression source, a compliance or legal ruling. It holds Start only (the ask policy, operator directive 2026-09-30): the paused drafts are still built and uploaded, and a list that lands later removes its matching leads from this client's drafts. It is not the context sweep draft-upload stop in `/cold-email-kickoff` Step 6 (`client-context-sweep.md`, "Gates"), which is a separate, named exception about the sweep and never about an item in this file.
- **`BLOCKS-START`:** an offer's yes or no, its capacity, or an input the offer cannot run without. It holds that offer's Start only: the list, the copy and the paused draft still get built, and every other offer goes ahead. Pressing Start on the sending platform is always the operator's, never the agent's, so this class tells the operator which draft must not be started yet.
- **`FEEDS`:** proof, research, copy, materials. Nothing waits on it, so it is never asked: it goes under `## Internal` as "not asked", with the reason ("Writing the message", section 2).

A client-side detail about the sending setup or reply handling only belongs here when the client alone can answer it and it changes the build: a sender name the client insists on, or a compliance limit on their side. Everything else about the sending platform, the inboxes, reply handling and booking is resolved by the run from the systems that hold it (`/cold-email-kickoff`, "Resolve it yourself first"), and FNNL handles replies and booking end to end, so those are never client asks.

And one stable key, lower-case with hyphens: `dnc`, `offer-2`, `offer-2-capacity`, `buyer-wording`, `proof-story`, `materials`. A key identifies the question, not its wording, so a merge dedupes on it. An offer's own yes-or-no item is keyed `offer-<aaron_rank>`, the offer's rank in Aaron's offer call (`aaron-lane.md`, `offer-readiness.md`), because the 48-hour clock looks for that key.

## Blocking items are never buried

Every item in the message is a `BLOCKS-UPLOAD` or `BLOCKS-START` item, since `FEEDS` items are not asked. The priority line after the questions names the one that matters most and what it holds ("Writing the message", section 4). A `BLOCKS-UPLOAD` item is never merged into another item: it always keeps its own number.

## Merging (the algorithm)

A skill with an ask, while a current message exists, merges into it. It never adds a second greeting, a "still open from before" block or a new section.

1. **One writer.** Only the main session writes the file. A sub-agent (for example `/social-proof-bank` running alongside `/tam-build`) returns its items as data (text, class, key, what it unblocks) and never touches the file.
2. **Filter, then drop what is settled.** Run every new item through the question filter ("Writing the message", section 2) before it enters the message; an item that fails goes to `## Internal` or is dropped, with its log line. Then remove an existing item whose source of truth shows it answered or no longer true:
   - `dnc`: the `client_blocklist` rows are in `suppression-list.csv`;
   - `offer-<n>` and its capacity: the client's yes or no is recorded with its evidence by `offer_approval.py` (`offer-readiness.md`), or the offer is dropped or vetoed;
   - `proof-*`: the fact is in the profile's `proof:` block;
   - anything else: the answer is recorded in the profile or the activity log.
   A `BLOCKS-UPLOAD` item is dropped when the file lands, when the operator waives it in chat, or when the client answers "none" or does not answer (filed as below). Each drop gets one activity-log line with its reason (`client-activity-log.md`).
3. **Dedupe by key.** Two skills asking the same thing leave one item, in the clearer wording, with both uses on its unblocks line.
4. **Order.** By class: `BLOCKS-UPLOAD`, then `BLOCKS-START`. Within a class, existing items keep their order and new ones are appended. A more natural reading order may put a blocker later, but only when the priority line names it. Renumber after every merge.
5. **Bulk content stays one item.** A long fill list (the proof bank's per-segment blocks and fill sheet, a `/proof-asset-request` form) enters the message only when the proof-asset gate rates it BLOCK, and then as one numbered item with its fields indented beneath it. Otherwise it is a "not asked" bullet under `## Internal`.
6. **Refresh the prose.** Rewrite sections 1 to 5 of the shape, the priority line and the sign-off so they still read true for the merged list.

## Writing the message (operator decision 2026-09-28)

The client message is the one thing the operator sends. It asks only what stops a launch, and it reads on its own, because the reader has none of our files.

### 1. One message, always

- There is one unsent message per client (Layout above), and every skill's asks merge into it.
- Never add a second greeting, a second section (no "offer section"), a follow-up draft or a "still open from before" block.

### 2. Which questions make the cut

Ask a question only when all three hold:

1. **It blocks a launch.** A specific campaign or offer cannot be started without the answer (`BLOCKS-UPLOAD` or `BLOCKS-START`, both of which hold Start only). Name that campaign or offer to yourself before writing the item.
2. **Only the reader can answer it.**
3. **It is not already answered.** Look first, in this order: `rulings.md` and `standing-rulings.md`, the profile, the handoffs and activity log, `client-intel.md`, the context sweep and Slack context, then a targeted read-only search (`phase-protocol.md` section 3, rule 1).

Drop the item, with one activity-log line giving the reason, when any of these is true:

- **Our own data already answers it:** replies and threads on the sending platform, the website, the suppression list, the profile, the activity log, a phase handoff. A "which is right?" question is often settled by what the client already sends to prospects.
- **The operator already decided it** at a checkpoint.
- **The operator can decide or waive it.** Ask in chat instead, at the next checkpoint.
- **Our own side owes it.** It goes under `## Internal`.
- **It only improves quality, research or strategy** (`FEEDS`): nice-to-have proof, past results, "would you fund X", "more later?". These are never asked. List them under `## Internal` as "not asked", with the reason, and raise them with the operator in chat if they matter.

A proof gap that the proof-asset gate rates BLOCK counts as `BLOCKS-START` and stays. If the operator asks for an item in chat, that overrides this filter for that item.

A good message usually has one to three questions. If more pass the test, keep them all and lean on the priority line.

### 3. Write for a reader with no files

- **Name nothing internal.** No file, skill, script, phase, gate, checkpoint, cluster or evidence ID. No internal terms (TAM, arm, rail, wave, Aaron, the locked stack), and no tool the reader does not use.
- **Put the facts in the message:** the prices, the names, the numbers, the offer in plain words. The reader must be able to answer without opening anything.
- **Refer only to things the reader owns or knows:** their price sheet, their doc, their people.

### 4. The shape, in this order

1. **Greeting and purpose (one or two lines).** What we are doing, and that there are N questions before launch.
2. **What we looked at (one or two lines).** The real scale: sends, replies, sources.
3. **What we found (three to five bullets).** Only the findings the questions depend on, with numbers from saved files, rounded honestly ("about").
4. **What we decided.** The offers in plain words, who we target and who we do not, and what changes. When an offer has a sample, promise a real example before anything goes out.
5. **Already done (optional, one or two lines).** Only what touches the reader or their systems, such as a blocklist write in a shared workspace.
6. **The questions, numbered.** Each one has:
   - a bold question;
   - one or two sentences on why, tied to a finding or decision above;
   - what happens with a partial answer ("if some are off-limits, that offer uses the rest");
   - the easiest valid answer, where one exists ("'None' is a fine answer").
7. **Priority line.** Which question matters most and what it holds, for example: "If you only have a minute, question 1 matters most. Without it, that offer does not start."
8. **Sign-off** in the operator's name.

Keep sections 2 to 5 under about 250 words. Write in the operator's voice: casual, with contractions and plain words, and no spaced em dashes.

### 5. Hand it to the operator

In chat, show the message, then a short "Before you send" list:

- any question the operator could delete because our own side may own it, and what else to delete with it;
- any figure that is dated rather than live, with its source and date;
- what was dropped and why, one line each.

The `What each unblocks:` list and the item classes stay in the file, never in the message.

## Filing the answers the operator pastes back (operator directive 2026-09-30)

The operator sends the message to the client, then pastes whatever came back into the thread. Claude files it the same turn, under the sent message, as `#### Answers <date>`:

1. **Match each answer to its item by key.** Record the answer in its home and log one `UPDATED` line per item:
   - `dnc`: a list goes into `suppression-list.csv` (`reason: client_blocklist`), and any matching leads are removed from this client's own draft campaigns; "none" or "no list" is stored as `dnc: none` in `rulings.md`, and it is never asked again.
   - `offer-<n>`: the yes, no or veto through `offer_approval.py` (`offer-readiness.md`).
   - anything else: the profile field it answers, and a line in `rulings.md`.
2. **An item with no answer is `skipped`.** Write `skipped (no answer, <date>)` beside it in the answers block and in `rulings.md`, apply the house default for that item, and never ask it again unless the operator asks for a re-ask. The defaults:
   - `dnc` with no answer: treated as `dnc: none`; suppression from the sweep still applies. This is listed once at the next checkpoint so the operator can reverse it.
   - a `FEEDS`-style or nice-to-have item: dropped.
   - **The one exception:** an offer's own yes-or-no (`offer-<n>`) stays open, because the client delivers that offer. Only that offer's Start waits; nothing else does.
3. **"Nothing came back"** is a valid paste: every item is skipped at once, under rule 2.
4. **Never re-ask in a new message** an item that was answered or skipped.

## Replacing a draft

An unsent draft rewritten wholesale is moved to `_archive/<YYYY-MM-DD>-client-asks/` (a record, never a SUPERSEDED banner in `client-asks.md`). An ordinary merge archives nothing: its activity-log line is the record.

## After it is sent

The operator confirms the send in chat. Claude then files the message under `## Sent` as `### Sent <date>`, and `## Current message` reads `Nothing unsent.` A new ask starts a fresh current message. An item already sent and still unanswered is not asked again; the nudge path chases it (`offer-readiness.md`), unless the operator asks for a re-ask. When the operator pastes the answers back, they are filed as the section above says, and `/continue-client` Step 1b asks for them first if a sent message has none.

## The 48-hour clock

For a pending offer, the clock runs from the newest `### Sent` entry whose unblocks list carries `[offer-<rank>]`. It reads "not sent" only when no sent message has carried that key, so drafting a new unsent message never resets an offer's clock. The offer-readiness scripts and board (`offer-readiness.md`) read the file this way.

## Legacy files

Files written before this rule may use another heading for the current message and extra parts (a second message, a History section). Such a file conforms the next time a skill writes its asks, which rewrites it wholesale (archive first, as above). It is not migrated on its own.
