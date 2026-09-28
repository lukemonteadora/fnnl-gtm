---
name: verify-execution
description: "The \"done means proven, never asserted\" loop. Use BEFORE telling the operator any high-stakes action or deliverable is done, live, sent or fixed. Sets falsifiable done conditions, checks each against ground truth, keeps worker and judge separate. Triggers: \"verify this\", \"prove it's done\", \"/verify-execution\"."
---

# Verify Execution

**From the former description:** Use BEFORE telling the operator that any high-stakes action or deliverable is done, live, sent, uploaded, applied, removed, built, or fixed - and whenever a result matters enough that being wrong about it is costly. It does three things an ordinary "I finished" does not: (1) writes the definition of done as objective, falsifiable conditions up front, (2) verifies each condition against GROUND TRUTH - the API/MCP, the file on disk, the live dashboard, a screenshot, a re-read - never against the agent's own claim that it acted, and (3) separates the worker from the judge so the thing that did the work does not get to grade itself. Catches the exact failure where an agent confidently reports "all emails sent" but only 25% went out, or hands over a draft that "looks finished" but is thin, broken, or partially applied. Other triggers: "did it actually work / send / apply", "is the campaign really live", "double-check before you tell me it's done", "definition of done". This is the GTM-execution and deliverable verifier; the built-in /verify covers running app/code behavior. Read it whenever you are about to claim something is complete.

**"Done" means proven against ground truth. It never means "I issued the command" or "it looks finished."**

The default failure mode of any capable agent is to report success the moment it *acts*, not the moment the action *worked*. The model is tuned to make you feel productive, which is not the same as making the outcome correct (memory: this is the same gap the `bounce-diagnosis` doctrine guards). The cost is real and asymmetric: an agent once told an operator it had sent all the outreach emails, and only 25% had actually gone out - nobody knew for four days. In a code review of ~1,600 AI-generated programs, roughly 40% shipped with security holes that looked fine until something broke in front of a client. The pattern is always the same: *finished* and *working* are different claims, and the agent collapses them.

This skill is the loop that keeps them apart. It is the invocable counterpart to the policy in `/autonomous-execution-policy` (which decides *when to proceed vs stop*); this decides *how to prove a step truly completed before reporting it*.

## The three pillars

### 1. Define "done" objectively, up front - before you build

Write the completion condition as **falsifiable facts you can check**, not as a feeling. "Looks good", "should work", "campaign is set up" are not done-conditions - they cannot be failed, so they cannot be verified, and "looks done" will quietly masquerade as done.

A good done-condition names a number, a field value, a file state, or an observable the system can confirm:

- ❌ "Leads are uploaded." → ✅ "Smartlead reports `lead_count = 487` on campaign 12345, matching the verified CSV."
- ❌ "Mailboxes are tagged." → ✅ "All 60 mailboxes return the client tag on `GET /email-accounts` (0 missing)."
- ❌ "The doc is done." → ✅ "All 6 files exist and are non-empty; market research lists ≥7 competitors; the drafts file has 25 drafts; none are thin/generic; spam-word-check passes."
- ❌ "Warmup is on." → ✅ "Each mailbox returns `warmup_enabled = true` with `daily_rampup ≥ 5` on GET."

If you cannot state a falsifiable done-condition for a step, that is the signal you do not yet understand what success means - resolve that first. The more objective the bar, the better autonomous runs and `/goal` behave, because the loop has something real to terminate on.

### 2. Verify against GROUND TRUTH, not against your own claim

After you act, go and **look at the system that holds the truth** and compare actual vs. the done-conditions. The fact that you issued the action, that the tool returned `200`, or that the script exited `0`, is **not** proof the outcome is correct. A `200` means the request was accepted, not that 487 leads landed, not that the tag stuck on all 60, not that the send actually happened for every recipient.

Ground truth, by deliverable type in this stack:

| You're about to claim... | Verify against (ground truth), not the action |
|---|---|
| Campaign is live / sent | Smartlead analytics: actual `sent_count`, campaign `status`, message history (SENT events) - not "I pressed Start" |
| Outreach/replies sent | Count the actual SENT/REPLY events vs. the intended count - catch the 25% case explicitly |
| Leads uploaded | Fetch leads from the campaign, count vs. the verified CSV row count |
| Mailbox settings (tags, 15-min gap, warmup, signature) | `GET` the email accounts and read the field back on every mailbox; report N-missing |
| Catch-alls removed | Re-query the campaign leads / reconcile against the removal manifest (lossless holdback) |
| DNS / auth correct | `check_dns_alignment`, SPF/DKIM/DMARC GET - not "I created the record" |
| Copy / doc / brief generated | Open the file, count the items, read it for thin/generic content, run `/spam-word-checker` |
| Lead list built | Row count, dedup rate, verification coverage via `/list-quality-scorecard` (grade ≥ B) |
| A web artifact / form (rare here) | Drive it with Chrome MCP / Playwright: screenshot each section at both viewports, submit malformed inputs, hunt edge cases |

When the deliverable is not in the table, the rule still holds: find the authoritative source of truth for *that* outcome and read it. If there is genuinely no way to observe the outcome, say so plainly - "I issued X; I could not independently confirm it because Y" - rather than dressing an unverifiable action up as confirmed.

**Report the evidence, not the verdict.** "Verified: Smartlead shows 487/487 leads on campaign 12345" beats "leads uploaded ✅". Showing the actual number is what makes it *verified, not asserted* - and it lets the operator audit the claim in one glance.

### 3. Separate the worker from the judge

The thing that did the work does not get to grade its own work - that is the same sycophancy/self-agreement trap `/roast` and `/consultant` guard against, applied to verification. Two ways to enforce the split:

- **Independent check.** Have a fresh sub-agent (clean context, given only the done-conditions and pointed at the artifact/system) confirm each condition, or re-verify from a fresh read rather than from memory of what you intended. This is exactly the `/goal` design: a separate evaluator decides `done = true`, the worker does not get to declare itself finished.
- **Adversarial stress test.** Before declaring complete, actively try to break it - feed edge cases, malformed inputs, the values a real user or recipient would actually produce. Find the failure the build pass and you both missed (the video's form test surfaced "no duplicate guard" and "lenient email validation" that the builder never considered). For GTM deliverables this means: the off-by-one in the slice, the row with a missing field, the variant token that did not render, the schedule that starts in the past.

## The loop

```
1. Write the done-conditions (falsifiable). 
2. Do the work.
3. Gather ground-truth evidence for each condition (query / read / screenshot - not your own claim).
4. Compare actual vs. each condition. Any miss → fix, then re-verify from scratch (don't trust the prior pass).
5. Have an independent check or adversarial pass confirm it (worker ≠ judge).
6. Only now report "done", and report it WITH the evidence. If anything fell short, say so loudly.
```

Step 6's last clause is the one that the 25%-email failure violated. **Fail loud.** If only part completed, if a condition could not be verified, or if the stress test found a real hole, surface it at the top of your report - never bury a shortfall, never round a partial up to "done". A partial honestly reported is useful; a partial reported as complete is the costly lie this skill exists to prevent. This is the same fail-loud posture as `/autonomous-execution-policy` and `/cold-email-weekly-rhythm`.

## When to run

- Before you tell the operator any high-stakes thing is **done, live, sent, uploaded, applied, removed, built, or fixed**.
- Inside a `/goal` run, as the verification pass before the completion condition is allowed to read `true`.
- After a batch action across many objects (mailboxes, leads, tags, campaigns) - batch actions are where "most of them worked" hides as "they all worked".
- Any time being wrong about completion is costly: client-facing output, a live system, spend, or source-of-truth.

Low-stakes, fully reversible, instantly visible results (a one-line file you just read back) do not need the full loop - right-size it. The bar is *cost of being wrong*, not ceremony.

## Relationship to neighbouring skills

- **Built-in `/verify`** verifies running app/code behavior. **This** verifies GTM execution and deliverables against ground truth. Use `/verify` when the question is "does this code do what it should when run"; use this when the question is "did this action/deliverable actually land as claimed".
- **`/autonomous-execution-policy`** decides *whether* to proceed. This decides *how to prove* a step finished before reporting it. The policy now points here.
- **`/list-quality-scorecard`, `/email-deliverability-audit`, `/spam-word-checker`** are domain-specific verifiers this routes to - it does not re-derive them.
- **`/roast` and `/consultant`** stress-test *ideas before building*; this stress-tests *work after building*. Same anti-sycophancy spirit, opposite end of the timeline.

## Anti-patterns - do not do these

- Reporting "done" because the tool returned success or you issued the command. Acceptance ≠ outcome.
- Treating `200` / exit-`0` / "no error" as proof the result is correct.
- Grading your own work with no independent check and no adversarial pass.
- Vague done-conditions you cannot fail ("looks good", "should be fine").
- Declaring done on partial completion - always check the count/coverage across the whole set, not just that the action "ran once".
- Burying or rounding up a shortfall. If 25% completed, the headline is "25% completed", not "completed".
- Verifying from memory of what you intended instead of from a fresh read of what actually exists.
