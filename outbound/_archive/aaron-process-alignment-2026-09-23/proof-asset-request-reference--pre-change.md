# Proof-Asset Request: Gate Procedure and Fill-In Form

This is the reference doc the cold-outbound skills read when a campaign angle needs hard proof (a named client, a real case study, or an exact number) that is not on file yet. It does two things: it defines the **proof-asset gate** (when to block vs flag), and it gives the **easy-to-fill form** to send the client so we get the real evidence back. Canonical doctrine: memory.

The point, in one line: we don't write hollow or invented copy to cover a missing fact. We be blunt about the gap and go collect the real thing, because real evidence is what makes copy actually land.

---

## What counts as a "proof asset"

A proof asset is a concrete, defensible piece of evidence the copy can stand on:

- **A named client or customer** the client is willing to name in cold email ("we did this for {named company}").
- **A real case study or result story** with a before/after the client will stand behind.
- **An exact number or metric** (a percentage, a dollar figure, a time saved, a count) tied to a real outcome, not a rounded guess or a marketing-page platitude.

It is NOT a proof asset if it is vague ("significant results"), unnamed when the angle needs a name ("a leading firm"), invented, or a number nobody at the client will defend if a prospect replies and asks.

This is a distinct gate, do not blur it with the two it sits next to:
- **Capability truth** = don't claim a product capability the client can't deliver.
- **Confirmed Deliverable Gate** = don't promise a CTA deliverable you can't fulfill after a reply.
- **Proof-asset gate (here)** = don't write copy whose credibility needs hard proof you don't have. Collect it first.

---

## The gate: block vs flag (decide on one question)

Before writing copy for an angle that references a case study, a named client, or an exact number, check whether that proof is on file (`client-profile.yaml`, `offer-intelligence.md`, an approved artifact, or the intake). If it is not, ask one question to decide the tier:

> **Is the angle hollow without this proof, or just less strong?**

- **BLOCK (hollow without it).** The angle's whole credibility hinges on the specific case study, named client, or number. Without it the email is hollow, or you'd be forced into a vague or fabricated claim. Action: emit the form below, route it to the client, and do NOT ship hollow copy for that angle. Either switch to a different evidence-backed angle the on-file proof already supports, or hold that slice until the proof returns.
- **FLAG-AND-PROCEED (would only strengthen).** The copy already stands on a real signal or observation, and the proof would just make it stronger. Action: flag the gap plainly, emit the form, proceed now with the viable version, and upgrade the copy when the proof comes back.

**Autonomy note.** This gate is NOT relaxed by `auto_execute`. It is a missing-source-material input gate, modeled on the verified-List Gate, not an operator decision. The "ask" is a data request to the client, not a pause that re-asks the operator, so it is fully compatible with hands-free execution. Proceeding past a BLOCK-tier gap with hollow or invented proof is a hard-rule violation regardless of execution mode.

---

## How to build the form (keep it genuinely easy)

1. **Pre-fill what's known.** Pull the client name, offer, and any partial proof already on file so the client is confirming and completing, not starting from scratch.
2. **Ask only the gap.** List ONLY the specific fields the planned angle needs. Three targeted asks, not a forty-field re-intake. If the angle needs one named case study with a number, ask for that one thing well.
3. **Show the shape of the answer.** Give one or two short examples per field so the client knows exactly what good looks like and can answer in under five minutes.
4. **State the return path.** Either a Google Doc the client edits in place (via the google-docs MCP), or a paste-back markdown block. Name which.
5. **Say why it matters and what's blocked.** One honest line: this is what lets us write the campaign that actually gets replies, and here's what's waiting on it.

---

## The fill-in form template

Copy this, strip the fields the angle doesn't need, pre-fill the bracketed context, and send it. Keep it short.

```markdown
# Quick proof check for your {campaign / angle name} campaign

Hi {client first name},

To write this campaign so it actually lands, I need a couple of real proof points
from you. Cold emails that name a real client and a real number get replies. Vague
ones ("we helped a leading firm") get ignored, so I'd rather get the real thing from
you than guess. This should take about five minutes.

Here's what I have on file already, please confirm or correct:
- {pre-filled known proof, e.g. "Best customer: {name}. Confirm we can name them in cold email? yes / no"}

And here's what I still need for this specific campaign:

## 1. A named client we can reference
Who is one customer like the people we're emailing that we can name by name in a cold
email? (If naming them is off-limits, tell me and I'll describe them instead, e.g.
"a 200-person logistics firm in the Midwest".)
> Example: "Acme Logistics, yes you can name them."
Your answer:

## 2. The result, with a real number
What concrete result did they get? Give me the actual figure you'd stand behind if a
prospect replied and asked about it.
> Example: "Cut their monthly billing reconciliation from 12 hours to under 2."
> Example: "Recovered $48k in missed renewals in the first quarter."
Your answer:

## 3. The before (so the result has contrast)
What did that look like before you came in? One line.
> Example: "Two people reconciling invoices by hand every month, errors slipping through."
Your answer:

---

When you're done, {return path: e.g. "just reply with the three answers" / "edit this
doc directly and let me know"}. Once I have these I'll have the campaign copy back to
you for review.
```

Trim to the gap. If the angle only needs one exact number to confirm, the form is one question, not three. If it needs a case study the client must approve for naming, lead with the naming-permission question. Never send the whole template when one field is the actual gap.

---

## After the proof comes back

- Record the confirmed proof asset into `client-profile.yaml` (or `offer-intelligence.md` / the relevant artifact) so it's on file and the gate doesn't re-fire next campaign.
- Note in the activity log that the proof was requested, and again when it returns (status `PENDING` then `DONE`).
- For a BLOCK-tier slice that was held, resume copy for that angle now. For a FLAG-tier slice already live, upgrade the copy and re-run the Copy QA Gate.

---

## Bank mode (the up-front, whole-bank gap-ask for `/social-proof-bank`)

The default form above is **reactive and single-angle**: one campaign needs one missing number. `/social-proof-bank` runs the same gate **proactively across the whole client at once**, after it has already self-gathered everything it can from the intake proof block, onboarding-call notes, offer-intelligence, the website / case-study scrape, and any voicenotes. Bank mode is that skill's single client-ask - so we never spin up a second client-facing path.

Everything above still holds. The only differences:

1. **Ask only what self-gather left blank.** By the time bank mode fires, most rows are already `on_file`. The form lists ONLY the segment x service-line rows still missing a real fact, and ONLY the raw fields that are blank in each. Pre-fill every fact already found as "confirm or correct", so the client is completing a mostly-filled grid, not answering a survey.
2. **Group by segment, one compact grid.** Instead of three prose questions for one angle, present a short table the client tops up: one block per ICP segment, the rows we're missing proof for, and the exact raw fields we need. Keep it to the genuinely-blank cells - a client should finish it in a few minutes even across several segments.
3. **Raw facts only - never copy.** The client fills `result` (the real number), `timeframe`, `named_client` + naming permission, `territory`, and which `service_line` it was. The client is **never** asked for the one-liner or the poke-the-bear question - `/social-proof-bank` synthesizes those itself and runs them through the Copy QA Gate. If you find yourself asking the client to phrase anything for the email, stop.
4. **Tiers still apply per row.** A `gap_block` row (a likely angle is hollow without it) is flagged as the priority ask; a `gap_flag` row (nice-to-have) is in the same form but marked optional. The bank is usable and shippable now regardless; returned facts upgrade it.

### Bank-mode form template

```markdown
# Quick proof top-up for {client} - {N} results we'd love the real numbers on

Hi {client first name},

We've pulled together your proof and results from your site, our calls, and your
onboarding so we can write campaigns that name real clients and real numbers (the kind
that actually get replies). We've filled in everything we could find - can you confirm
those and fill the few blanks below? Raw facts only, we'll turn them into the copy.
About five minutes.

{Repeat per segment:}
## Segment: {segment name}

| What you did (service) | Client we can name? | The result / number | Over what timeframe |
|---|---|---|---|
| {service_line, pre-filled} | {named_client if known / "name OK? y/n"} | {result if known, else blank} | {timeframe if known, else blank} |
| ...one row per missing/‑unconfirmed case study... | | | |

> If a client can't be named, just say so and we'll describe them instead
> (e.g. "a 200-person logistics firm in the Midwest"). If a number is approximate,
> give your best real figure - never a made-up one, we'd rather describe it than invent it.

---

When you're done, {return path}. We'll fold these in and have the campaign copy to you
for review - you won't need to write a word of the emails yourself.
```

Trim to the blanks. If self-gather already filled a segment completely, that segment isn't in the form at all. Bank mode is emitted once per bank build; on the client's return, `/social-proof-bank` folds the facts in, flips those rows `on_file`, re-synthesizes their one-liner + poke-the-bear, writes the confirmed proof back to `client-profile.yaml` `proof:`, and (optionally) regenerates the client-facing xlsx.

**Markdown paste-back vs the Google Sheet.** The compact grid above is the lightweight paste-back ask, right when only a blank or two is missing. When there are several gaps across segments, `/social-proof-bank` sends the fuller **client-fill Google Sheet** instead — a shareable sheet with worked example rows as a fill-guide, plus a ready email/Slack message covering what / why / how. Same rule either way (raw facts only, never copy). Structure, example rows, and the outreach messages: `social-proof-bank-client-fill-template.md`.
