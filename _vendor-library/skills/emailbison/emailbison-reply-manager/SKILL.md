---
name: emailbison-reply-manager
description: MCP-first inbox management for EmailBison. Read, triage, categorize, reply to, and search campaign replies. Use when managing the reply inbox, handling interested leads, searching for specific reply content, or running triage after a campaign has replies.
---

# EmailBison Reply Manager

Use this skill when locked `run_state.sending_platform = EmailBison` or when the user asks to read, reply to, or triage EmailBison campaign replies.

All operations run through MCP tools (`mcp__emailbison__*`). Load them via ToolSearch before calling.

Positive reply classification lives in `/emailbison-positive-reply-scoring`. This skill handles the operational inbox - reading, replying, categorizing, and searching.

## Core MCP Operations

### List Replies

```text
Tool: mcp__emailbison__list_replies
Params: {
  "campaign_id": <id>,       # optional - omit for all campaigns
  "status": "unread",        # unread | interested | not_interested | all
  "per_page": 50,
  "page": 1
}
```

Use `status: "interested"` for the leads worth acting on first.

If the total replies are large (>300), export to CSV instead:

```text
Tool: mcp__emailbison__export_replies_csv
Params: { "campaign_id": <id> }
```

### Read a Full Reply Thread

```text
Tool: mcp__emailbison__get_reply
Params: { "reply_id": <id> }
```

Print the full thread - subject, sender, body, timestamp - before deciding how to respond.

### Send a Reply

Always read the full thread before replying. Confirm the reply content with the user before sending - this action is not easily undone.

```text
Tool: mcp__emailbison__send_reply
Params: {
  "reply_id": <id>,
  "body": "Thanks, let's schedule a call. What time works for you?"
}
```

Do not send on the user's behalf without explicit confirmation of the message body.

### Categorize a Reply (Interested / Not Interested)

```text
Tool: mcp__emailbison__call_api
Extended tool: categorize_reply
Body: { "reply_id": <id>, "category": "interested" }
# or "not_interested"
```

### Mark a Reply as Read

```text
Tool: mcp__emailbison__call_api
Extended tool: mark_reply_read
Body: { "reply_id": <id> }
```

### Search Replies by Keyword

```text
Tool: mcp__emailbison__search_replies
Params: { "query": "pricing", "campaign_id": <id> }
```

Use this to find all replies mentioning a topic (e.g. "budget", "timing", "competitor").

### Reply Analytics

```text
Tool: mcp__emailbison__get_replies_analytics
Params: { "campaign_id": <id> }
```

Returns reply breakdown by status, time, and sender.

## Triage Workflow

When the user asks "do I have any new replies?" or "show me interested replies":

1. Call `mcp__emailbison__list_replies` with `status: "unread"` (or `"interested"`).
2. For each reply, call `mcp__emailbison__get_reply` to get the full thread.
3. Classify intent: positive_interested, positive_soft, positive_referral, neutral, negative, OOO, unsubscribe.
4. Surface:
   - Positive replies needing a human response
   - Referrals to add to a new list
   - Hostile replies that may need sender review
   - Unsubscribes to confirm in EmailBison

Show a summary table, then ask which ones to act on.

## Reply Response Guidelines

- Keep replies short (2-4 sentences max).
- Match the prospect's tone - if they're casual, be casual.
- If they asked a question, answer it directly before the CTA.
- Never auto-send. Always show the draft to the user first.
- Attach a Calendly or booking link for interested replies if the user has one.

## Common Workflows

### "Do I have any new replies?"

```text
Tool: mcp__emailbison__list_replies
Params: { "status": "unread", "per_page": 50 }
```

Summarize: count by campaign, surface any that look positive.

### "Show me interested replies from this week"

```text
Tool: mcp__emailbison__list_replies
Params: { "status": "interested", "per_page": 100 }
```

Filter by date client-side if the API doesn't support date ranges natively.

### "Read the full reply from John Smith"

1. List replies, search for John Smith by name in the results.
2. Call `mcp__emailbison__get_reply` with the matching reply ID.
3. Print the full thread.

### "Reply to John saying thanks, let's schedule a call"

1. Get the reply ID from the list or search.
2. Draft the reply.
3. Show draft to user with a native choice prompt:
   ```text
   Ready to send:
   <draft>

   A. [Recommended] Review or edit before sending
   B. Send as written
   C. Do not send
   D. Custom answer
   ```
4. Only call `mcp__emailbison__send_reply` if the user explicitly chooses the send option.

### "Find replies that mention pricing"

```text
Tool: mcp__emailbison__search_replies
Params: { "query": "pricing" }
```

### "Mark all OOO replies as read"

List replies, filter for OOO content, then show a native choice prompt before bulk-marking:

```text
I found <N> OOO replies to mark as read.

A. [Recommended] Review the filtered list first
B. Mark all <N> as read
C. Do not mark anything
D. Custom answer
```

## Common Gotchas

1. **Never send a reply without user confirmation.** The message goes to a real prospect.
2. **OOO replies are not leads.** Don't categorize them as interested.
3. **List replies returns metadata, not full content.** Always call `get_reply` before drafting a response.
4. **Search is keyword-based.** Synonyms won't match - try "cost" if "pricing" returns nothing.
5. **Categorizing as interested in EmailBison is just a label.** It doesn't notify anyone or trigger automation unless you've set that up.

## What To Do Next

- After triaging interested replies: hand off to the user for calls or use `/emailbison-positive-reply-scoring` for full scoring.
- To export all replies for analysis: `mcp__emailbison__export_replies_csv`.
- Unsubscribe complaints: confirm the lead is unsubscribed in EmailBison, then optionally add to blocklist via `call_api` -> `add_to_blocklist`.

## Related Skills

- `/emailbison-positive-reply-scoring` - classify all replies and calculate positive reply rate
- `/emailbison-campaign-manager` - campaign-level operations
- `/emailbison-lead-manager` - lead lookup and updates

## Activity Log Protocol

Before doing client work, **read** `profiles/<client>/activity-log.md` (its CURRENT STATE block) so you know what was last done, what's pending, and what's blocked. After any material step (something newly built, updated, confirmed-existing, left pending, blocked, completed, or cancelled), **append** a one-line entry (newest first) to that log's LOG section and refresh its CURRENT STATE. Status vocab: CREATED/UPDATED/EXISTS/PENDING/BLOCKED/DONE/CANCELLED/NOTE. Keep it short — record status, not raw output. Full protocol: `client-activity-log.md`.
