# Offer decoupling archive (2026-09-30)

Retired on 2026-09-30: the house offer guides that told the system what offers to create, how many to test and how to score them.

| File | What it held |
|---|---|
| `house-brainstorm.md` | The house candidate generation flow, the four-sentence and "why not" tests, the 7-point score and the weak-offer screen |
| `offer-archetypes.md` | The offer-archetype table (A to K) and the interactive-tool playbook |
| `front-end-offer-standard.md` | The house standard for what a front-end offer must be |
| `common-mistakes.md` | The house list of offer-building mistakes |

**Why.** Operator directive of A-Sales, 2026-09-29: no skill or reference holds a guide on what offers to create, how many to test or how to score them. Offers come only from a fresh `/ask-aaron` call that reads Aaron's live Notion content bank. It was applied to FNNL by operator approval on 2026-09-30.

**What replaced them.** `.claude/skills/lead-magnet-brainstorm/SKILL.md` is now a recorder: it writes Aaron's offers word for word, fills the mechanical fields and runs the rails (truth, Signal-Capability Check, evidence that resolves). `/offer-intelligence` stays evidence-only. With no Notion access there are no offers, and there is no fallback to these files.

Nothing reads these files. They are kept for history only and moved with `git mv`, so their text is unchanged.
