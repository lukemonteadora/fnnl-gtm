# Client messages (`client-asks.md`)

The one home for how a client's asks are written, merged and filed (operator decision 2026-09-28). Every skill that asks a client for something points here in one line; this file holds the rule.

`profiles/<slug>/client-asks.md` holds **at most one unsent message** to the client: one greeting, one numbered list, one sign-off, one `Sent:` line. The operator sends it, or the teammate the operator names. **Claude never sends it:** it never emails it, never posts it to Slack or any other channel, and never shares a linked sheet or doc with the client. It drafts the file and stops.

**When it is written.** The message is drafted at checkpoint 1 and updated at checkpoints 3 and 4 (`/cold-email-kickoff`, "Client asks never hold the flow"; `phase-protocol.md`). Any skill with a client ask in between (for example `/social-proof-bank`'s proof request, or `/proof-asset-request`) merges into the same message. Client asks never hold the flow: only the one thing that cannot happen without the answer waits, as each class below says.

## Layout (in this order)

1. **`## Current message`.** First line `Sent: not yet`. Then the message as a blockquote. Then a `What each unblocks:` list, which is ours and never part of the message: one line per item, `- <n> [<key>] <CLASS>: <what it unblocks>`. When nothing is unsent, the section reads `Nothing unsent.` and has no `Sent:` line.
2. **`## Internal`.** Items owed by our own side (the account manager, the operator, the list builder). One bullet each, starting with the owner's role. Never written as a second message.
3. **`## Sent`.** Each sent message under its own `### Sent YYYY-MM-DD` heading, verbatim, newest first, with its unblocks list and without its `Sent:` line. The only line-start `Sent:` in the file is the one inside `## Current message`.

A short "What this is" line may sit under the file title. Nothing else goes in the file.

## Item classes and keys

Every item carries exactly one class:

- **`BLOCKS-UPLOAD`:** a do-not-contact list, a suppression source, a compliance or legal ruling. It holds the paused-draft upload, and it is the same stop as the context sweep upload stop in `/cold-email-kickoff` Step 6 (`client-context-sweep.md`, "Gates"): no draft goes up to the sending platform while it is open, even under `auto_execute`.
- **`BLOCKS-START`:** an offer's yes or no, its capacity, or an input the offer cannot run without. It holds that offer's Start only: the list, the copy and the paused draft still get built, and every other offer goes ahead. Pressing Start on the sending platform is always the operator's, never the agent's, so this class tells the operator which draft must not be started yet.
- **`FEEDS`:** proof, research, copy, materials. Nothing waits on it.

A client-side detail about the sending setup or reply handling only belongs here when the client alone can answer it and it changes the build: a sender name the client insists on, or a compliance limit on their side. Everything else about the sending platform, the inboxes, reply handling and booking is resolved by the run from the systems that hold it (`/cold-email-kickoff`, "Resolve it yourself first"), and FNNL handles replies and booking end to end, so those are never client asks.

And one stable key, lower-case with hyphens: `dnc`, `offer-2`, `offer-2-capacity`, `buyer-wording`, `proof-story`, `materials`. A key identifies the question, not its wording, so a merge dedupes on it. An offer's own yes-or-no item is keyed `offer-<aaron_rank>`, the offer's rank in Aaron's offer call (`aaron-lane.md`, `offer-readiness.md`), because the 48-hour clock looks for that key.

## Blocking items are never buried

Every `BLOCKS-UPLOAD` and `BLOCKS-START` item either comes first in the list or is named by number in a priority line just above the list ("if you only have a minute, 1, 2 and 5 matter most"). A `BLOCKS-UPLOAD` item is never merged into another item: it always keeps its own number.

## Merging (the algorithm)

A skill with an ask, while a current message exists, merges into it. It never adds a second greeting, a "still open from before" block or a new section.

1. **One writer.** Only the main session writes the file. A sub-agent (for example `/social-proof-bank` running alongside `/tam-build`) returns its items as data (text, class, key, what it unblocks) and never touches the file.
2. **Drop what is settled.** Remove an item whose source of truth shows it answered or no longer true:
   - `dnc`: the `client_blocklist` rows are in `suppression-list.csv`;
   - `offer-<n>` and its capacity: the client's yes or no is recorded with its evidence by `offer_approval.py` (`offer-readiness.md`), or the offer is dropped or vetoed;
   - `proof-*`: the fact is in the profile's `proof:` block;
   - anything else: the answer is recorded in the profile or the activity log.
   A `BLOCKS-UPLOAD` item is dropped only when the file lands or the operator waives it in chat. Each drop gets one activity-log line with its reason (`client-activity-log.md`).
3. **Dedupe by key.** Two skills asking the same thing leave one item, in the clearer wording, with both uses on its unblocks line.
4. **Order.** By class: `BLOCKS-UPLOAD`, then `BLOCKS-START`, then `FEEDS`. Within a class, existing items keep their order and new ones are appended. A more natural reading order may put a blocker later, but only when the priority line names it. Renumber after every merge.
5. **Bulk content stays one item.** A long fill list (the proof bank's per-segment blocks and fill sheet, a `/proof-asset-request` form) is one numbered item with its fields indented beneath it.
6. **Refresh the prose.** Rewrite the context paragraph and sign-off so they still read true for the merged list.

## Replacing a draft

An unsent draft rewritten wholesale is moved to `_archive/<YYYY-MM-DD>-client-asks/` (a record, never a SUPERSEDED banner in `client-asks.md`). An ordinary merge archives nothing: its activity-log line is the record.

## After it is sent

The operator confirms the send in chat. Claude then files the message under `## Sent` as `### Sent <date>`, and `## Current message` reads `Nothing unsent.` A new ask starts a fresh current message. An item already sent and still unanswered is not asked again; the nudge path chases it (`offer-readiness.md`), unless the operator asks for a re-ask.

## The 48-hour clock

For a pending offer, the clock runs from the newest `### Sent` entry whose unblocks list carries `[offer-<rank>]`. It reads "not sent" only when no sent message has carried that key, so drafting a new unsent message never resets an offer's clock. The offer-readiness scripts and board (`offer-readiness.md`) read the file this way.

## Legacy files

Files written before this rule may use another heading for the current message and extra parts (a second message, a History section). Such a file conforms the next time a skill writes its asks, which rewrites it wholesale (archive first, as above). It is not migrated on its own.
