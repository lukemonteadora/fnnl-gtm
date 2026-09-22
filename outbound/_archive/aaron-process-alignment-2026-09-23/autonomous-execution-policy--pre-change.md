---
name: autonomous-execution-policy
description: Cross-cutting policy for running the coldoutbound flow with minimal operator interaction. Defines when to proceed autonomously vs stop, how the standing spend budget (never asked) replaces per-purchase confirmations, the rule against re-asking recorded decisions, the hard-stop list that always needs the operator, the don't-idle-wait / interleave rule, the browser/UI-fallback HARD RULE (finish no-API steps yourself in the browser, hands-free, but under the exact same boundaries, never to authenticate, pay-by-card, accept OAuth/terms, or cross any hard stop), and the parallelize-by-default HARD RULE (fan independent work out across sub-agents instead of running it serially, with a disjoint-inputs + disjoint-output-targets + post-merge dedup guard so no two agents produce duplicate output). Every flow and setup skill defers to this. Read it whenever you are about to ask the operator a question, gate on spend, hit a step with no MCP/API path, wait on an async process, or run independent work that could fan out.
---

# Autonomous Execution Policy

The operator wants this flow to run **hands-free with as little back-and-forth as possible** (operator directive). This policy is the single source of truth for *when to proceed vs stop*. Where any other skill's older "ask at every material fork" wording conflicts with this, **this policy wins** for runs where `run_state.execution_mode = auto_execute` (the operator's default).

## Stack Resolution (read before any tool step)

This skill names **capability roles**, never specific vendors. Resolve every role to the
tool this workspace has actually chosen by reading:

```text
outbound/stack-contract.yaml
```

Roles this skill uses: sending platform, mailbox provider, email verifier, waterfall enricher. (Research is not a stack role: it runs on Claude Code itself, the `/deep-research` harness plus WebSearch and WebFetch, per the no-AI-API rule, operator directive 2026-09-22.)

**If a role this step needs is empty or missing in the contract, STOP and route to
`/stack-setup`.** Never substitute a guessed vendor, and never hardcode a tool name into
an artifact this skill writes.

## 1. Default posture: proceed, don't ask

Under `execution_mode = auto_execute`:

- **Pick the strongest option, record it, proceed.** Offer, launch campaign, mailbox mix, billing period, sender persona, domain candidates, source workflow — choose the best per the skill's own rubric, write it to `run_state`/profile, and keep going. The one exception is the offer: lock the whole test set `/lead-magnet-brainstorm` returns (a primary plus ranked validation arms) and let `/campaign-strategy`'s flip criterion pick the winner in market, because Aaron tests three or four offers rather than picking one in advance (doctrine §5; operator directive 2026-09-22). Do not pause to have the operator pick.
- **Report, don't gate.** State what you chose and why in one line, then continue. The operator can correct in flight.
- **Never re-ask a recorded decision.** If it's already in `run_state`, `client-profile.yaml`, `campaign-plan.md`, the profile, a saved memory, or the operator's latest message — use it silently. (Persona, mailbox mix, `billing = Monthly`, locked offer/campaign, domain list, etc.)

`execution_mode = review_gates` keeps the older per-fork confirmations — use it only when the operator explicitly asks to be walked through.

## 2. Spend: a standing budget, never asked

- **Every client run gets a standing budget of $100 (operator directive 2026-09-22, which replaces the 2026-09-18 hold-at-$0 default in `stack-contract.yaml`).** Onboarding, intake, kickoff and run start never ask about spend. `run_state.spend_ceiling_usd` is written as `100` for every client, and each new wave starts a fresh $100. If the operator names a different figure for a client, record it (with the date and their reason) and use it silently from then on.
- **Auto-approve every paid data step whose running total stays within the budget**: enrichment, contact and verification credits, and list-workbench Actions. This holds under both `execution_mode` values, because it is a spend rule, not a strategy gate (`review_gates` still stops at its strategy forks, such as the TAM GO gate's whole-universe-or-slice call). Report each charge ("Spent $X of $100") but do **not** stop to confirm.
- **Mailbox infrastructure is outside the budget.** Domains and mailbox capacity are bought only after the operator approves that setup's purchase total once (the kickoff infrastructure step asks for it). Then auto-approve every purchase whose running total stays inside the approved figure, report each ("Spent $X of $Y approved"), and never re-confirm per purchase. The $100 data budget is never authority to buy infrastructure.
- **Only stop when a purchase would push a running total over its budget.** Then surface the overage and ask to raise it for this client.
- **Older profiles.** A `spend_ceiling_usd` of 0, null, or missing that was only the old ask-first default (no note beside it, or a note saying it is the workspace default) becomes `100` (the operator approved this switch for existing clients on 2026-09-22): rewrite it, log `UPDATED run_state.spend_ceiling_usd -> 100 (standing budget)`, and say so in one line of that run's report, as a notice rather than a question. A figure the operator set on purpose (it carries a note) stays, scoped as its note says, until they change it. The old AI research budget field (`research_budget_usd_per_provider`) is gone, so ignore it.
- **Track the running total in the client's activity log.** Each paid step appends one line, `NOTE spend: +$X on <step>, wave total $Y of $100` (infrastructure purchases log against their approved setup total instead), so a resumed session can add up what the wave has already spent. A wave starts when a new launch wave is selected (kickoff Step 6, or `/continue-client` routing a new wave), and its total starts at $0.
- Still route spend through `/api-cost-governance` for the preview and the ledger; the budget is the approval, not each click.

## 3. Hard stops — always require the operator (never auto-do)

These are NOT "interaction to minimize" — they are real stops. Do them only with the operator, regardless of `execution_mode`:

- **Spend above the run's budget** (`run_state.spend_ceiling_usd`, the standing $100 unless the operator set another figure), or an infrastructure purchase beyond the setup total the operator approved.
- **Starting / sending a live campaign.** Uploads create PAUSED/DRAFT campaigns only; the operator launches. **HARD RULE: drafting is NOT warmup-gated (operator directive 2026-06-17):** the moment the copy sequence is approved / QA-passed and the verified list is ready (and `sending_platform` is locked), build the campaign **fully** in the sending platform: sequence with all variants, leads loaded, the correct sender accounts attached, settings (tracking, stop-on-reply, and the rest of the sending platform's pre-set defaults as resolved from the stack contract: client tag, schedule, and delivery toggles), and schedule, so the ONLY thing left for the operator is *review + press Start*. Never hold off building the draft because mailboxes are still warming. Warmup, placement tests, and Gates A/B/C gate the **live send**, not the draft build.
- **Entering financial credentials, adding a card, or enabling standing auto-recharge.** The operator owns payment. The agent MAY spend from an already-funded wallet or an already-saved payment method within the run's budget (or, for infrastructure, within the setup total the operator approved), but must never type card details or set up recurring billing config.
- **Changing the locked provider stack, sending platform, or a source-of-truth artifact** after it's locked.
- **Research routing & primary-pass enforcement (no-AI-API rule, operator directive 2026-09-22).** `run_state.research_routing` has exactly one value, **`claude_deep_research`** (the Claude native `/deep-research` fan-out harness): set it when unset, and treat a retired `third_party_ai` or `claude_native` value as `claude_deep_research`. Proceed on it; do NOT stop to ask. There is no third-party research engine and no research key: research runs only on Claude Code itself, so a missing key can never be a research hard-stop, and gaps are filled by a second targeted `/deep-research` pass or WebSearch/WebFetch, never another AI provider. The Stage-1 primary research pass MUST be an **actual logged `/deep-research` run** (the harness + the `api-balance-ledger.md` run-log line that `scripts/research/research_routing_check.mjs` reads + `ai_research_provider += claude-deep-research`); finishing a research step with no logged deep-research primary is a **flagged violation**. Bulk crunching and classification run as Claude Code sub-agents fanned out per section 9 and `/personalization-subagent-pattern`. Full rule: `/ai-model-routing`.
- **Pre-launch safety gates** (warmup ≥2 weeks, inbox-placement/auth, final QA). These BLOCK the **live send / Start** on fail — they are guardrails, not preferences. Never relax them for autonomy. They do **not** block building the PAUSED draft (see the drafting HARD RULE above): the draft is staged complete and ready while warmup runs, so launch is one click the day the senders mature.
- **Emitting sendable copy or finalizing a campaign object before the VERIFIED-LIST GATE passes for the slice** (`verified-list-gate.md`): no verified `leads.verified.csv` slice + list-quality grade ≥ B + locked strategy → no copy. This BLOCKS on fail like the pre-launch gates; autonomy never relaxes it.
- **Irreversible deletes; legal / compliance risk; anything in the global safety rules.**

When a hard stop is hit, surface it crisply with the exact thing needed, and — per §5 — go do other productive work rather than idling on the answer.

## 4. Bundle the unavoidable asks

When you genuinely must ask (a hard stop, or run start), **batch every needed decision into one interaction** with pre-filled recommended answers (native Interactive Inputs). Don't drip one question per step. One upfront batch >> five mid-run prompts.

## 5. Don't idle-wait — interleave (memory: `dont-idle-wait-interleave`)

When the flow hits a long async wait — mailbox provisioning → ACTIVE, 2-week warmup, DNS/WHOIS propagation, a scrape/enrichment job, a placement test — **do not sit in a tight polling loop.**

1. Start a background poll / wake-up for the waiting task.
2. **Move on to the next productive work** that isn't blocked: another client's setup (e.g. a different client's mailbox provisioning), skill/library updates, list building, copy, research, or the next independent step of this same run.
3. **Recheck the waiting task when the poll fires or when you next pause** on the interleaved work.

Never hold the session idle on a clock. Keep progress moving somewhere at all times.

## 6. Browser / UI fallback — finish hands-free, within the same boundaries (HARD RULE)

The operator wants the flow finished **for** them, not handed back with "do this last UI step yourself." So when a needed step has **no MCP/API path** (or the API genuinely can't do it), do **not** punt to the operator by default — **complete it yourself in the browser** (Claude-in-Chrome MCP preferred; computer-use as fallback), the same way any provider dashboard step would be done by hand. This is a real expectation, not a nicety: a UI-only step is still your job.

Canonical examples of "no API, so use the browser hands-free":
- Running a **bound Google Apps Script** (e.g. the Cold Email Mailbox Tracker's `logInboxes_*` / `maintainCostsTab`): inject into Monaco, save, select the function, Run, read the execution log. (Done live on a prior client run 2026-06-16.)
- A **dashboard-only purchase from an already-funded wallet / already-saved payment method** within the approved budget (the run's standing budget for data, or the approved setup total for infrastructure), **on a dashboard the extension can actually drive**.
- A UI-only toggle, export, or setting with no API equivalent on an automatable dashboard.

**Tooling caveat: not every dashboard is automatable.** Some SPAs defeat the Chrome extension. Some provider dashboards are known non-automatable surfaces: the page never reaches idle, so clicks, types, and screenshots hang (~45s) and fail. Where a UI is a known non-automatable surface, the browser fallback doesn't apply and the step stays operator-gated for that *tooling* reason, not because the rule exempts it. Try the browser, but don't loop on a surface already known to hang.

**The browser is just another execution channel — it is subject to the EXACT SAME boundaries as MCP/API. It is NOT a loophole that unlocks anything the rules forbid.** The hard stops in §3 and the global explicit-permission list still bind on every channel. The browser fallback therefore must **never** be used to:
- enter passwords or **authenticate / sign in**; create accounts; enter card or other financial-credential details; enable standing auto-recharge;
- accept terms, consent/cookie banners, or grant **OAuth / SSO** permissions;
- submit a form containing personal data; click an **irreversible send/publish/confirm** that isn't already authorized;
- exceed the run's budget or an approved setup total, change the locked provider stack/source-of-truth, or relax a pre-launch safety gate.

**Practical gate (the decisive test):** the browser fallback only works on a dashboard the operator's session is **already logged into**. If the step would require *logging in*, that is the password/authentication boundary again → it's an operator hard-stop, not a browser task. Acknowledging an already-signed-in "you're signed in as X — OK?" context dialog is fine (it grants nothing new); a fresh login/consent screen is not.

**Calibration from a prior client run (so expectations are right):**
- The **tracker update** (bound Apps Script, no Sheets-API way to run `maintainCostsTab`) *was* exactly the in-scope case: done hands-free in the browser. ✅
- The **mailbox-capacity purchase** (funded wallet, no buy-capacity API) is the *shape* §6 targets, BUT that mailbox provider's dashboard was one of the non-automatable surfaces described above, so it stayed operator-gated for a **tooling** reason, not because the rule exempts it. On an automatable provider dashboard, the same buy IS a browser task. ⚠️ blocked by tooling, not by policy.
- **Linking one platform to another** (typing one platform's **password** into another platform's form) is *still* operator-only on every channel: the browser would not have changed that. Operator-only credential entry across platforms is a hard stop. ❌ stays a hard-stop.

When a step genuinely hits a boundary above, *then* surface it crisply with the exact action the operator must take — and per §5 go do other productive work meanwhile. But exhaust the browser-fallback path first; "there's no API for it" is not, by itself, a reason to stop.

## 7. Verify execution before you report it done - never assert (HARD RULE)

Running hands-free raises the stakes on truthful completion: the operator is not watching each step, so a false "done" can sit undetected for days (the canonical failure: an agent reported it had sent all the outreach, and only 25% had actually gone out). **Autonomy is never a license to report a step complete from your own claim that you acted.** Before you tell the operator anything is done, live, sent, uploaded, applied, removed, or built:

- **Verify against ground truth, not the action.** Query the system that holds the truth (the sending platform's actual sent count / campaign status / message history, a `GET` on the email accounts, the file on disk, a re-read) and compare to objective done-conditions. A `200` / exit-`0` means the request was accepted, not that the outcome is correct. Across a batch, check the count/coverage on the whole set - "most worked" is not "all worked".
- **Fail loud on any shortfall.** If part completed, or a condition could not be confirmed, surface it at the top of the report - never round a partial up to "done". A partial honestly reported is useful; a partial reported as complete is the costly failure this rule exists to prevent.

The full loop (falsifiable done-conditions → ground-truth evidence → worker-≠-judge check) lives in `/verify-execution`; run it before reporting completion of any high-stakes step in an autonomous run.

## 8. What "less interaction" does NOT mean

- It does **not** weaken the PAUSED-draft rule, the pre-launch gates, the spend ceiling, or any global safety rule.
- It does **not** mean guessing silently on a genuine fork with no sensible default — if there's no rubric/default and the choice is material and irreversible, that's a hard stop, ask once.
- It does **not** mean skipping the record step — autonomous choices must still be written to `run_state`/profile so the run stays resumable and auditable.
- It does **not** mean the browser fallback (§6) can cross a hard stop — a UI being the only path never authorizes a prohibited action.
- It does **not** mean parallelizing dependent or unsafe work — the §9 fan-out default never overrides an ordering dependency, a provider rate/spend limit, or any hard stop.

## 9. Parallelize by default — fan independent work out across sub-agents (HARD RULE)

Hands-free runs are long and the operator isn't watching, so wall-clock speed matters and there is no reason to do independent work one piece at a time. **When a step breaks into pieces that don't depend on each other, fan them out across parallel sub-agents (Claude Code Task tool, launched together in one message) instead of grinding through them serially.** This is the flow-level version of the workspace-level "Parallelize independent work" rule in this repo's `CLAUDE.md`. It used to be optional in these skills; it is now the default, and serial is the exception that needs a reason.

- **Mandatory trigger (checkable).** Fan out whenever the work decomposes into two or more independent sub-tasks: no shared mutable state, no ordering dependency, each chunk self-contained. In this flow that is the common case, not the rare one: TAM ICP-fit scoring, per-lead personalization (`/personalization-subagent-pattern`), per-company "why-now" research, multi-client weekly sweeps (`/cold-email-weekly-rhythm`), multi-artifact conformance audits (`/cold-email-flow-audit`), classifying or QA-ing a large list. Default these to fan-out.
- **Serial needs a one-line reason.** If the work clears the bar and you still run it serially, log why (a genuinely sequential dependency, a single tiny step, or a provider rate/spend limit that parallelism would breach). No stated reason means you should have fanned out. This is the enforcement tooth, in the same spirit as section 7's verify-before-done.
- **Right-size the split.** Cut the work into the smallest number of clean, independent chunks that genuinely run at once (useful Task-tool parallelism caps around 10 agents); the personalization pattern's 10-20 items per agent is a good default grain. Too big loses context, too small wastes orchestration.
- **Script-level concurrency already counts.** Where a builder script parallelizes correctly inside itself (the `email-waterfall` script's `--concurrency` pool against whatever tool fills the waterfall-enricher slot, the enrichment crawl's ~40 workers in `/tam-build`), that satisfies this rule for that step: don't also wrap it in agents, and respect that provider's limit. A pay-per-valid waterfall enricher throttles on its own side, so the speed lever there is the script's `--concurrency` setting, not more agents. Agent fan-out is for independent work that isn't already inside one concurrent script.
- **Spend-safe fan-out — the §2 ceiling still binds across all agents.** Each parallel agent sees only its own slice, not the running total, so N agents that spend concurrently (enrichment, verification, scraping) can collectively race past `run_state.spend_ceiling_usd` before any single total catches it. When the fanned-out work spends money, partition the budget too: give each agent a slice ceiling, or cap per-item spend so the worst case (every agent spends its max at once) still lands under the §2 ceiling. The spend ceiling is a hard stop (§3); fan-out never relaxes it.

**No duplicate outputs — the guard that makes fan-out safe (HARD RULE).** Parallel agents can't see each other, so without a guard they overlap or converge. All three layers are required:

1. **Disjoint inputs.** Partition so every item belongs to exactly one agent (by id, index range, or batch). Verify the slices cover the whole set with zero overlap before launch — no item processed twice.
2. **Disjoint output targets.** Each agent writes to its own file or key (`/tmp/<task>-<batch-id>.json`), never a shared file — concurrent writes to one file double-append or clobber (the same orphaned-double-write trap `/tam-build` and `/email-waterfall` warn about). Merge afterward by a stable id (`lead_id`).
3. **Post-merge uniqueness check.** After merging, catch convergent duplicates: different inputs that produced near-identical output (the "sub-agent wrote the same line 10 times" failure already flagged in `/personalization-subagent-pattern`). De-dupe by id and content, and re-run any converged agents with an explicit diversity instruction. Partitioning fixes overlap; only this step catches convergence.

The canonical fan-out plus merge plus dedup implementation is `/personalization-subagent-pattern`. Before reporting the step done, verify the merged set's count and coverage against the input (section 7) — fan-out makes a silent partial easy to miss.
