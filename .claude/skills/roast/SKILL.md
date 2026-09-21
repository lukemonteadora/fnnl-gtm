---
name: roast
description: "Fire-and-forget anti-sycophancy council. Spins up a panel of differentiated personas in parallel to attack an idea, offer, plan, or campaign angle from every side, then a judge synthesizes one verdict - green-light / reshape / kill - plus the single cheapest test you can run in the next 48 hours to find out if it's real. Use when you want a hands-off stress test that returns a verdict without a back-and-forth: inside a /goal or autonomous run, before committing build effort to an offer or lead magnet, or any time you'd rather get a graded verdict than talk it through. This is the NON-INTERACTIVE counterpart to /consultant - reach for /roast when you want to fire it and walk away, and /consultant when the back-and-forth itself is the point. Triggers include \"roast this\", \"roast my idea/offer\", \"council this\", \"green-light or kill\", \"stress-test this and just give me the verdict\", and \"/roast\". Built to stack with /goal and parallel sub-agents."
---

# Roast

Pull Claude out of agreement mode and let a **council** tear into an idea, then deliver one graded verdict and the cheapest next move - **without** a back-and-forth. Models are documented yes-men: they fail to push back on how you framed something far more often than a person would, and it gets *worse* the more they know about you and the longer the conversation runs. Roast fixes that by force: separate adversarial personas, each with its own clean context, each told to attack from one specific angle, synthesized by a judge that has to rule.

**This is the autonomous sibling of `/consultant`.** Same anti-sycophancy spirit, same model machinery, opposite UX:

- **`/roast`** - fire-and-forget. Fans out parallel persona sub-agents, returns a verdict, requires no dialogue. Use it inside `/goal`/autonomous runs, or when you just want the graded answer.
- **`/consultant`** - interactive. Goes back and forth with you in real rounds and converges with you in the loop. Use it when the dialogue is the deliverable.

If a run is interactive and the user wants to argue it out, prefer `/consultant`. If it must complete unattended or the user asked for "just the verdict", use `/roast`.

## The council (run the personas in parallel)

Spin each persona up as its **own sub-agent with a clean context** (the `Agent` tool, or a `Workflow` fan-out) so none of them is anchored by the others or by your first take - this is the whole point, and it also keeps any single context from rotting. Give every persona the same tight brief (idea + locked constraints + the three intake answers below). Run them concurrently, not in sequence.

- **Contrarian** - only job is to find the fatal flaw. Why does this fail, who already does it better, what kills it in month one. Scores harshly.
- **Expansionist** - the biggest honest upside. If this works, how big, what's the wedge, what's the 10x version.
- **First-principles thinker** - no outside context, no analogies, pure logic from the unit economics and the mechanism. Does the math actually work.
- **Deep researcher** - pulls **real** market data and competitor pricing off the web. Use the research path the stack already prefers: Perplexity via `ai_router` (skeptical, cited - see `/consultant`) and/or DiscoLike for competitor/company reality. Open the citations; don't relay an uncited claim.
- **Buyer** - role-plays the **target customer / ICP** and says straight up whether they'd pay, and what would make them pay. **Altitude rule (HARD):** this is ONE strategic read of the *offer* from the buyer's point of view. It is NOT a per-contact reply-probability loop and must never become one (memory: `recipient-simulation-narrowed-to-platitude-read`). If the idea is tied to a known client, anchor this persona to that client's locked ICP in `client-profile.yaml`.
- **Judge** - takes all five findings and rules. Does not do its own research; it weighs and decides. On a material call, get the judge an independent reasoner read too (`gpt-5.1` / `o3` via `ai_router`, per `/consultant`) so even the synthesis isn't Claude grading Claude.

### Before the council runs: three quick intake questions

Roast is non-interactive once it starts, but it needs three things to aim. Ask them in one batched prompt up front (native Interactive Inputs), with sensible pre-fills so an autonomous run can proceed on defaults if unanswered:

1. **Who is the actual target buyer?**
2. **What's your edge / what do you already have?** (distribution, audience, unfair advantage - or honestly, none yet)
3. **What are the constraints and budget, and how fast do you need the first dollar?**

These mirror the inputs the council scores against. Under `execution_mode = auto_execute` with no answer, take the best inference from context/profile, state the assumption, and run - don't stall.

## Reuse `/consultant`'s machinery - don't reinvent it

Roast differs from `/consultant` only in being parallel and non-interactive. Everything else is shared, so reuse it rather than re-authoring:

- **The model calls** - the `ai_router.mjs` invocations for the reasoner critic and the Perplexity fact-check are specified in `/consultant` ("The calls"). Use them as-is, including the reasoning-token rule (`--max-tokens ≥ 4000` or a reasoning model returns empty).
- **Judge the outside read, don't parrot it** - every persona/model objection gets weighed against what you actually know (the files, the locked decisions) before it reaches the verdict. A model can't see the operator's stack and is confidently wrong sometimes; keep the true kernel, flag the overreach.
- **Read before you judge** (`brutal-review-read-files-first`) - if the idea leans on a real file, offer, or number, read it before the council rules on it.
- **Failure handling** - if a persona's model call errors transiently, degrade to another reasoner or the `advisor` tool and keep the council going; never let one dead sub-agent kill the run.

## The verdict (the output)

Deliver one scannable brief in the house style (lead with the point, no spaced em dash):

- **Verdict: GREEN-LIGHT / RESHAPE / KILL**, with a confidence level.
- **One-line ruling** - the call in a sentence (e.g. "Kill it as described - a free, no-login commodity wrapped in a subscription built to churn - but keep the engine and aim it at a narrow paying niche").
- **Why** - the strongest case against (from the contrarian/first-principles) and the strongest case for (expansionist), and how the judge weighed them.
- **Per-persona scores** - each persona's 1-10 score, so the spread is visible at a glance (a 2/2/3/2 with a lone 8 from the expansionist tells its own story).
- **The buyer read** - would the target customer pay, and what would change their answer.
- **The single cheapest 48-hour test** - the one concrete action (usually: DM/email 20-30 real ICP prospects before writing any code or copy) that would tell you whether this is worth pursuing, even in its reshaped form. This is the most valuable line in the output - make it specific and runnable today.
- **If RESHAPE** - the specific reshape, not a vague "make it better".

## When the idea is GTM / tied to a client

- Anchor the buyer persona to the locked ICP; pull offer/competitor reality from `/offer-intelligence` and DiscoLike rather than re-deriving it.
- A GREEN-LIGHT or RESHAPE here is a natural feed into `/offer-intelligence` (validation) and `/lead-magnet-brainstorm`; the cheapest-test line is the pre-build gate those skills reference.
- Follow the activity-log protocol if it's a specific client: read CURRENT STATE first, append a one-line entry with the verdict after.

## Anti-patterns - do not do these

- Running the personas in one context (they anchor each other - defeats the point). Each gets a clean sub-agent.
- Letting the buyer persona drift into per-contact simulation or reply-probability scoring. Offer-level only.
- A judge that won't rule. Roast must always land on GREEN-LIGHT / RESHAPE / KILL.
- Parroting a web result or a model objection without checking it against the real files/decisions.
- Manufacturing a fake objection to look rigorous, then folding to "but overall it's great". If it's strong, say so and sharpen it.
- Using `/roast` when the user clearly wants to argue it out in real time - that's `/consultant`.
- Starving a reasoning model's token budget so it returns empty (≥4000).
