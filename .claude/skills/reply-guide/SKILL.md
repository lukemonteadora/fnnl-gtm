---
name: reply-guide
description: "Builds a client's reply guide: the plain, forwardable document (plus a PDF) whoever answers the client's inbox uses to reply to prospects, in the client's own voice, one section per offer being tested. Runs at the end of Phase 2 after the offers lock, and again at the start of Phase 4 only when Phase 3 changed the launch set. Triggers: \"build the reply guide\", \"reply guide for <client>\", \"/reply-guide\"."
---

# Reply guide

**This builds the one document the people answering a client's inbox need:** what to send for every kind of reply, for every offer being tested, and the 5-minute call. It is written in the client's voice, with nothing about the agency or this workspace in it, and it ships as Markdown plus a PDF. The exact shape is `outbound/reference/reply-guide-template.md`, so read it first. This file only says when the skill runs and in what order.

Paths resolve under `outbound/`. Client profiles are gitignored, so read them with Bash or Read.

## When it runs (ruling `reply-guide`, operator directive 2026-10-06)

| Mode | When | What it does |
|---|---|---|
| `build` | **Phase 2, step 10:** after the offers lock and the readiness board is written, before checkpoint A | Builds the guide for every offer Phase 2 locked for testing |
| `refresh` | **Phase 4, start:** only when `reply_guide.py diff` says the launch set changed in Phase 3, or there is no manifest | Rebuilds for the new launch set. Aaron reviews only the new or changed lines |
| on ask | The operator says "build the reply guide", or adds, removes or changes an offer or campaign outside the phases | `build` against the launch set the operator named |

It never sends, uploads or posts anything. The guide is a file the operator hands over.

## Steps

1. **Read the inputs** listed in the template (Part 1, "Inputs"): the locked offers and their `delivery_reply`, the client's `rulings.md` (the voice, held or internal offers, any launch-set override from the operator), `social-proof-bank.md`, `website-profile.md`, and the booking link and speed-to-lead owner from the rulings, `run_state` or the Phase 2 handoff.
2. **Fix the launch set and its keys.** Use one key per campaign: `offer-<aaron_rank>@<segment>`, or `op-<slug>@<segment>` for an offer the operator added outside Aaron's call. Put an offer the client must not see yet (an internal ruling, such as `pre-renewal-internal`) under `internal_offers`. It goes in `reply-guide-internal.md`, never in the main guide.
3. **Pick a block per offer** (booking, asset or tool, template Part 1). Fill the template's Part 2:
   - The yes and delivery lines come from Aaron's `delivery_reply`, reworded into the client's voice.
   - Questions and pushback are kept only where they apply to this client.
   - Proof comes only from public, nameable lines.
   - Offers are described in plain words. No cold copy is quoted.
   - **Every campaign section opens with "What they get after a yes"** (template Part 1, operator directive 2026-10-06). It covers the short version, the steps from the yes to the result, an example of what the end recipient sees (from the offer's recipe or worked sample, with that sample organisation's facts swapped for `{single-brace}` placeholders) and the not-a-fit line. Each campaign also gets the "Can I see what it looks like?" reply. Anything the client hasn't confirmed is written as "set on the call".
4. **Aaron's pass on the house lines.** Send one fresh `/ask-aaron` sub-agent every prospect-facing line that isn't his own `delivery_reply`, with the prompt rule "write in the client's voice; never name the agency" (`aaron-lane.md`, new reply lines). Use his returned lines as written, unless one breaks the voice ruling or a truth rail. Then one fix round goes back to him, and if it still fails, keep the template line and list it under "Calls I made". In `refresh` mode, send only new or changed lines. Record `aaron_pass` in the manifest. With no Notion access, set `aaron_pass: pending` and say so at the checkpoint. The guide is still built.
5. **Write the manifest** `outbound/profiles/<slug>/reply-guide.manifest.json`:
   ```json
   {"client": "<Client>", "built": "<YYYY-MM-DD>", "built_in": "phase 2 | phase 4 refresh | operator ask",
    "launch_set": ["offer-1@<segment>", "..."], "internal_offers": ["..."],
    "forbidden_terms": ["<agency staff first and last names>", "<sender persona names>", "<bot names>"],
    "booking_link_value": "<the URL the team will paste>", "aaron_pass": "done | pending"}
   ```
   `reply_guide.py` already forbids the agency name, persona names, tool names, file names, slash commands, internal ids and spaced dashes. The manifest adds this client's people.
6. **Check and render.**
   ```
   python outbound/scripts/reply_guide.py render outbound/profiles/<slug>
   ```
   - It runs the leak and bracket check, writes `exports/<Client>-Reply-Guide.pdf`, then re-checks the PDF's own text and stamps the manifest with the hash and page count.
   - Fix every failure and render again. Never hand over a guide that failed.
   - A warning that the booking link carries the agency's name goes to the operator: the client should supply a neutral URL.
   - Run `check` (not `render`) on `reply-guide-internal.md`. Never render it.
7. **Report:** the PDF path, the page count, the campaigns covered, the Aaron pass status and any warning. In Phase 2 this goes in the handoff and the checkpoint A summary as display only, never as a question. Append a line to the client's activity log.

## Phase 4 refresh check (the first thing Phase 4 does)

Read the launch set from the Phase 3 handoff (`phases/phase-3-list.md`, "Launch set keys", which includes any operator override) and run:
```
python outbound/scripts/reply_guide.py diff outbound/profiles/<slug> --launch-set "<comma-separated keys>"
```
- **Exit 0, unchanged:** skip the rebuild and note "reply guide unchanged" under "Calls I made". If the manifest's `aaron_pass` is still `pending`, run step 4 (Aaron's pass) and step 6 (re-render) only.
- **Exit 2, changed or no manifest:** run `refresh` (steps 1 to 7) before `/lifecycle-copy`. Name what was added or removed at checkpoint B.

## Rules that bind every run

- **The client's voice, always** (ruling `reply-voice-client`). Never "we work with <Client>". Never an agency or staff name. The cold signature is the client's own rule and stays out of the guide.
- **The guide is the source for the per-campaign reply files.** `/lifecycle-copy` builds each campaign's `interested-reply.md` from it, and when the two differ the guide wins and both are fixed together.
- **The PDF ships every time** (standing exception to the plain-text rule, ruling `reply-guide`). The Markdown stays the source. The internal file is never exported.
