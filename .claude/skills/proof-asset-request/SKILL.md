---
name: proof-asset-request
description: Generate an easy-to-fill form that collects the real proof a campaign needs from the client (a named client to reference, a real case study, an exact number) when that proof is not on file yet. Use when a planned angle leans on hard proof you don't have, so the copy can stand on real evidence instead of vague or invented claims. Triggers include "ask the client for proof", "we don't have a number/case study/client name for this", "prep a form to get proof from <client>", "proof-asset request", and "/proof-asset-request".
---

# Proof-Asset Request

Thin generator for the client proof-collection form. When a campaign angle needs a named client, a real case study, or an exact number that is not on file, this produces a short, pre-filled, gap-targeted form to send the client so we get real evidence back, instead of writing hollow or invented copy.

This is the operator-invokable front door to the **Proof-Asset Gate**. The full gate procedure (block vs flag) and the form template live in `proof-asset-request.md` (the reference doc, resolved under `02-skills/coldoutbound-skills/`). The doctrine is memory `proof-asset-gate-doctrine`.

## The rule in one line

Don't write copy whose credibility needs hard proof you don't have. Be blunt about the gap, collect the real thing. This is a distinct sibling to capability truth (don't claim a capability the client can't deliver) and the Confirmed Deliverable Gate (don't promise a CTA you can't fulfill).

## What to do

1. **Identify the gap.** From the planned angle or slice (in `campaign-strategy.md`, the campaign plan, or the operator's ask), name the specific proof the copy needs: which named client, which case study, which exact number. Be specific. One angle usually needs one or two proof points, not ten.

2. **Check what's already on file** so you don't ask for what you have. Read `profiles/<client>/client-profile.yaml` (the `proof:` block and `best_customer`), `offer-intelligence.md`, and any approved artifact. Pre-fill those into the form as "confirm or correct", and ask only for the genuine gaps.

3. **Decide the tier and say it plainly** (see the reference doc):
   - BLOCK (the angle is hollow without this proof): copy for that angle is held until the proof returns. Say so.
   - FLAG (proof would only strengthen viable copy): copy proceeds now and gets upgraded when the proof returns. Say so.

4. **Build the form** from the template in the reference doc. Keep it genuinely easy: three targeted fields at most, one or two examples per field, and a clear return path (a Google Doc via the google-docs MCP, or a paste-back markdown block). Trim every field the angle doesn't need.

5. **Hand it off.** Output the finished form to the operator (and, if asked, create it as a Google Doc to send). Log the request in the client's `activity-log.md` as `PENDING`.

6. **On return:** record the confirmed proof into `client-profile.yaml` (the `proof:` block) so the gate doesn't re-fire next campaign, update the activity log to `DONE`, and resume or upgrade the affected copy.

## Autonomy

Not relaxed by `auto_execute`. This is a missing-source-material input gate (modeled on the verified-List Gate), and the form is a data request to the client, not a pause that re-asks the operator. So generating and sending the form is fully compatible with hands-free execution. Shipping BLOCK-tier copy with hollow or invented proof is a hard-rule violation in any execution mode.

## Related

- `proof-asset-request.md` (reference doc): the gate procedure and the full form template.
- `proof-asset-gate-doctrine` (memory): the doctrine.
- `/client-intake-form`: collects proof assets up front so most clients never hit this.
- `/campaign-strategy`: earliest gap detection.
- `/campaign-copywriting`: enforces the gate at copy time.
