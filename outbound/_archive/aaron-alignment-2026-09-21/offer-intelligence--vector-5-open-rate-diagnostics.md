# Archived: offer-intelligence, open-rate diagnostics

- **Source file:** `.claude/skills/offer-intelligence/SKILL.md`
- **Sections:** Mode: Validation, Step 2, Vector 5 "Key diagnostics" (the two open-rate bullets); Common mistakes ("Treating reply rate alone as an offer problem"); Integration table (`/email-deliverability-audit` row)
- **Archived:** 2026-09-21 (operator-approved Aaron alignment)
- **Reason:** opens are not tracked in this system (open tracking stays off on the sending platform), so open rate reads 0% and the branch sent every flat offer to a deliverability audit; Aaron says "Don't track opens" (doctrine §9) and Eric agrees. The copy-before-offer ordering in the Common-mistakes line also inverts Aaron's diagnostic order (doctrine §2). Replaced by the trigger-based deliverability check (bounce above the house threshold, a placement-test flag, reply rate near 0.1%, contacts-per-positive jumping), after which the offer is a live candidate.

The original text, verbatim:

Vector 5, Key diagnostics:

> - Open rate 30%+ but reply rate below 1% -> offer is a candidate bottleneck only after checking bounce rate, inbox placement or deliverability, list quality, and copy. The subject may have earned attention, but the ask is not proven to be the cause yet.
> - Open rate below 20% -> deliverability or subject line problem. Do not blame the offer. Run `/email-deliverability-audit` first.

Common mistakes:

> - **Treating reply rate alone as an offer problem.** Offer is only a candidate bottleneck after deliverability, bounce rate, list quality, and copy have been checked. If open rate is below 20%, run `/email-deliverability-audit` first.

Integration table:

> | `/email-deliverability-audit` | If open rate is below 20%, run that skill first. Do not diagnose the offer when deliverability may be the actual problem. |
