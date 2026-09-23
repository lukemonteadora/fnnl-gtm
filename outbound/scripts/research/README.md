# Research scripts: the evidence ledger and the research-routing audit

This folder holds the research tooling that runs under the no-AI-API rule (operator directive 2026-09-22): the evidence ledger, which stores and counts each client's market evidence, and an audit that checks each research-skill run logged its Claude native primary pass. The evidence standard both serve is `outbound/reference/market-evidence-standard.md`; the routing doctrine the audit enforces lives in `/ai-model-routing` (the "Research Routing: HARD RULE (Claude native deep research primary)" section).

**Nothing here calls an AI provider, and nothing should.** Research runs inside Claude Code itself: the `/deep-research` fan-out harness (`anthropic-skills:deep-research`) is the primary pass, and thin spots are filled by a second targeted `/deep-research` run or by the built-in WebSearch and WebFetch tools. Those are skill and tool invocations inside the session, not scripts in this folder.

The scripts that used to call AI provider APIs from this folder were moved to the workspace archive on 2026-09-22. See `outbound/_archive/no-ai-api-2026-09-22/MANIFEST.md` for what moved and why. Do not restore them as a research, crunch, or copy path.

Zero dependencies, pure Node (native `fs` and JSON). Requires Node 18+. None of these scripts reads an API key, makes a network call, or spends anything.

| Script | What it does | Network or AI? |
|---|---|---|
| `evidence_ledger.mjs` | Owns each client's evidence ledger (`profiles/<slug>/_research/evidence.csv`): `ingest` validates rows, skips duplicates, flags syndicated quotes, assigns `E-####` IDs and appends; `stats` counts each cluster honestly and runs the mechanical Research QA checks | Neither |
| `research_routing_check.mjs` | Audits the ledger in `../api-balance-ledger.md` for research runs with no logged primary pass, or with a third-party AI provider logged | Neither |
| `_content.mjs`, `_summ.mjs` | Old helpers that read saved result files from disk | Neither |

## `evidence_ledger.mjs`: the evidence ledger

The deterministic half of the market-evidence layer. `/offer-intelligence` collects evidence into batch files, `/market-evidence` drives this script, and the script is what makes the counts honest: nobody types a count or a ledger row by hand.

```bash
# Ingest a run folder's batch files (each a JSON array of rows, or {"rows": [...]})
node outbound/scripts/research/evidence_ledger.mjs ingest --client <slug> --in outbound/profiles/<slug>/_research/runs/<run_id> --run <run_id> [--collected-by <label>] [--dry-run] [--json]

# Count every cluster listed in pain-clusters.md and run the mechanical QA checks
node outbound/scripts/research/evidence_ledger.mjs stats --client <slug> [--cluster C-01] [--json] [--strict]
```

- **ingest** reads only the `batch-*.json` files in a run folder, so raw captures saved beside them (pastes, WebFetch and browser reads, reply exports) are never mistaken for rows. Exit codes: 0 all rows valid; 2 some rows rejected (the valid ones were still ingested; fix the rejected ones and re-run, duplicates are skipped safely); 1 fatal.
- **stats** reads the `evidence:` and `counterevidence:` lines under each `## Cluster C-xx` heading in `pain-clusters.md`. It reports sightings (unique source threads), buyer-side sightings, voices, sites, the evidence-type and tier mix, recency, ICP match and the loudest source's share, plus checks Q1-Q4, Q6-Q8 and Q10 of the Research QA gate. `--strict` exits 1 when any check FAILs.
- `--dir <path>` points either command at a research folder other than `profiles/<slug>/_research` (useful for tests).
- A reply row with no URL gets `source_site: sending-platform`, whichever platform `run_state.sending_platform` names.
- The script is the ONLY writer of `evidence.csv`. A person may change only the `status` column (for example to `retracted`, with a reason in `notes`).

## `research_routing_check.mjs`: was a compliant primary research pass logged?

Telemetry for the research-routing hard rule. It scans the run-log table in `../api-balance-ledger.md` (that is, `outbound/scripts/api-balance-ledger.md`) and flags any research-skill run that has **no logged primary pass**: the drift where a research skill ran on a bare inline WebSearch, or on nothing, instead of the fan-out harness. It also flags any run whose ledger lines name a third-party AI provider.

**The two accepted primary labels:**

- `claude-deep-research` (or `claude_deep_research`, the `run_state.research_routing` spelling): the `/deep-research` harness. The older ledger phrasing `Claude /deep-research (primary), <n> sub-agents / categories` also passes.
- `claude-subagent-fanout`: the harness's declared fallback when it is unavailable, a logged flat fan-out of 4 to 8 research sub-agents working from the same brief.

**Every third-party AI label fails,** even when the same cell also names a Claude primary or says "deep research" (for example a third-party deep-research model name, or `claude-deep-research` plus a third-party gap-fill). Under the no-AI-API rule no third-party AI provider is a valid route, as primary or as helper. The deny list is the `THIRD_PARTY_RE` line in the script.

```bash
cd "outbound/scripts/research"

# Operator audit across ALL clients (PASS/FLAG per research-skill run + per-client coverage; exit 1 if any FLAG)
node research_routing_check.mjs

# In-skill self-check for one run (the research skills run this before declaring research done)
node research_routing_check.mjs --skill offer-intelligence --client Northwind --json   # {ok:true|false, violation, third_party, ...}

# Filters
node research_routing_check.mjs --client ExampleCo           # one client (substring, case-insensitive)
node research_routing_check.mjs --since 2026-06-01          # ledger rows on/after a date
node research_routing_check.mjs --json                      # full audit as JSON
node research_routing_check.mjs --ledger <path>             # audit a different ledger file
```

**What it reads.** Ledger table rows shaped `| Date | Skill | Provider(s) | ... |`, where the Date cell is `YYYY-MM-DD` and the client is the last parenthetical in the Skill cell, for example `| 2026-09-22 | offer-intelligence (ExampleCo) | Claude /deep-research (primary), 5 sub-agents / categories | ... |`. Rows are grouped per client and skill into one run. A run passes when at least one of its rows names an accepted primary and none of its rows names a third-party AI provider. That ledger line is an audit record, not a spend row: Claude Code usage is not metered API spend in these skills.

**Research skills it checks:** `lead-source-strategy`, `offer-intelligence`, `data-point-discovery`, `campaign-strategy`, `auto-research-public`, `icp-onboarding` (edit `RESEARCH_SKILLS` in the script to change the set).

**Exit codes:** `0` all logged runs pass (or none found), `1` a FLAG or a self-check violation, `2` ledger file not found.

**Limitations, stated plainly:**

- It can only see runs that LEFT a ledger line. A research run that logged nothing is invisible to it, which is why every research skill must append its primary-research line.
- It matches labels, not behavior. A line that says `claude-subagent-fanout` passes whether or not 4 to 8 sub-agents really ran, so the activity-log entry and the run folder remain the evidence of what happened.
- Rows are grouped per client and skill across all dates, so one third-party row keeps that client's `--skill` self-check flagged until `--since` is set past it. The deny list also matches a research-skill row that mentions the sender-headshot image exception by vendor name, so log that call on its own non-research row.
- The accepted primary pattern is deliberately broad (anything naming "deep research" passes unless a third-party label is also present), so the older ledger phrasing keeps passing. A new third-party provider name that is not yet on the deny list would slip through: add it to `THIRD_PARTY_RE` when one appears.

## `_content.mjs` and `_summ.mjs`: legacy readers for old saved result files

Two tiny helpers that read a saved JSON result file shaped `{ ok, provider, model, content, citations | search_results | results, usage }`:

```bash
node _content.mjs saved_result.json   # prints content, then the listed sources/citations
node _summ.mjs saved_result.json      # one line: ok | provider | model | tokens | cost | evidence URL count
```

That JSON shape was the output of the archived provider router. **Nothing in the live flow produces it any more**, so these two only help read older saved outputs that may still sit in client folders. They make no calls and read no keys.
