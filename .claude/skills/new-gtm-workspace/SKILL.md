---
name: new-gtm-workspace
description: Fork this entire GTM system into a clean workspace for a DIFFERENT operating company. Clones from the git remote so secrets, client profiles, lead CSVs, and run-state are excluded by .gitignore automatically, overlays any uncommitted work the clone would miss, scrubs the committed remainder that still names this company or its clients, resets the stack contract and MCP connectors to empty so the new workspace inherits no tech stack, parks vendor integrations in an inactive library, removes personal and operator-specific skills, and optionally creates a new PRIVATE GitHub repo as a gated step. Use when standing the system up fresh for a new operating company, with none of this company's identity, clients, or tool choices baked in. Triggers - "new gtm workspace", "fork the gtm system", "spin up gtm for <company>", "clone the whole system for <company>", "/new-gtm-workspace". NOT for onboarding a client into THIS workspace (that is /cold-email-kickoff), NOT for resuming a client (/continue-client), and NOT for choosing this workspace's own tools (/stack-setup).
---

# New GTM Workspace (clean fork for a different operating company)

Makes a reusable duplicate of this whole system so it can run for a different company. The source workspace is never modified. The output is a new sibling folder, stripped of this company's identity, its clients, and its tool choices, with a guided path to the new company's own stack.

## What this is NOT

- **Not `/cold-email-kickoff`.** That onboards a *client* into the *existing* workspace.
- **Not `/continue-client`.** That resumes a known client mid-flight.
- **Not `/stack-setup`.** That records *this* workspace's tools. This skill creates a *new workspace* whose stack starts empty.

If the request is "onboard/resume `<name>`" inside this workspace, stop and route to those instead.

## Path resolution

`scripts/...`, `profiles/...`, `stack-contract.yaml` resolve under `outbound/` of the **source** workspace, per the repo `CLAUDE.md` rule. `_vendor-library/` resolves from the repo root. The deterministic scan helper is `scripts/new_gtm_workspace.mjs`.

## Material Decision Rule

At every material fork (disk location, repo account and visibility, what to strip versus park, what counts as personal): name the realistic options, recommend the strongest, say why the alternatives are weaker, then commit. Ask before the outward or hard-to-reverse steps (creating the repo, the first push). Proceed without asking on the local clone and the reports, which are reversible.

## The core idea: the git boundary does most of the scrub

Do **not** raw-copy the working directory. A file copy drags in every secret and all client data.

**Clone from the git remote instead.** The `.gitignore` already excludes `.env` files, `**/profiles/`, `*.csv`, run-state, scratch, and installers. A fresh clone therefore arrives with client data and secrets **already absent**. That reduces "scrub everything" to the bounded job of scrubbing the committed remainder.

### The gap this creates, and how to close it (do not skip)

A clone reflects the **last push**, not the working tree. Uncommitted work is silently lost, and on an actively-developed system that is usually the *newest* doctrine.

Before cloning, run `git status --short` on the source **in full**, not truncated:

- ` M` entries are modified tracked files. The clone will carry a **stale** version.
- `??` entries are untracked. These are often **brand-new skills** the clone will miss entirely.

After cloning, copy those specific files from the source working tree over the clone. Be selective: overlay genuine skill and doctrine files, and deliberately **not** the untracked client scratch (per-client build scripts, result dumps, research output), which is exactly what you are trying to leave behind.

Verify the overlay by diffing a couple of the copied files against the source.

## Steps

### Step 0 — Confirm the target

Ask once, with sensible pre-fills:

- **Company name**, required.
- **Slug**, kebab-case, defaulted from the name.
- **Disk location**, defaulting to a sibling of the source: `<parent>/<Company> GTM System`.
- **GitHub account and visibility**, defaulting to the current `gh auth status` account and **private**, because the repo will eventually hold client data. Offer a different account only if raised.

### Step 1 — Preflight (verify live, never trust memory)

1. `gh auth status` must show a login with `repo` scope. If not, stop. Authentication is the user's to do.
2. `git -C "<source>" status --short` in full, to build the overlay list above.
3. `git -C "<source>" remote get-url origin`.
4. Confirm the target folder does not exist. **Never overwrite.**

### Step 2 — Clone, then overlay

```
git clone <origin-url> "<target-dir>"
git -C "<target-dir>" remote remove origin
```

Then apply the Step-1 overlay. State plainly that secrets and client data are absent because they were never committed.

### Step 3 — Scan the committed remainder

Run `node scripts/new_gtm_workspace.mjs --scan --dir "<target>"`. It greps for this company's and its clients' identifiers **and for hardcoded Google resource ids**, then reports in buckets:

- **CROSS-ACCOUNT RISK.** Committed files hardcoding a Google Sheet, Drive, or Apps-Script id. These are opaque strings with no company name in them, so an identifier grep alone misses them, yet in a fork they still point at the **source company's live accounts**. A forked skill that *writes* to one silently contaminates real data. This is the most dangerous class. **Reset every id in an executable or write-target position to a placeholder.** Check the parked vendor library too; an inactive pack can still be activated later carrying a live id.
- **DELETE.** Committed client-data and history files. Remove outright.
- **RESET.** Operator-identity files (`CLAUDE.md`, `README.md`, the credential registry, the start-here docs). Rewrite to the new company, keep the structure.
- **FLAG.** Illustrative client mentions inside skills. **Never blind find-replace these**; that corrupts skills. Genericize them by reading each in context.

### Step 4 — Scope to cold outbound only (HARD RULE)

A forked workspace carries **only** the cold-outbound system and the infrastructure it depends on. The `.gitignore` does not exclude the rest, so the clone **will** contain it. Remove explicitly:

- **Personal and social-content skills.** Content publishing, content planning, profile optimization, personal daily briefings, a named person's recurring meeting prep, an individual operator's tracker. These are not integrations, so delete rather than park; there is nothing for the new company to activate.
- **Generic non-cold-outbound frameworks.** Multi-agent dev frameworks and anything else not in service of cold outbound.
- **Stale archives** of old loose skill files.
- **The source company's branding and collateral.** Flow presentations, branded screenshots with real persona headshots, onboarding decks.
- **The source company's internal planning and audit docs**, typically the `_UPPERCASE.md` one-offs. Internal notes, often with client data.
- **Operational run-state and scratch (the most dangerous leak).** `scripts/_*` results and plans hold real registered domains and account dumps. A client browsing the repo can read "you bought 96 domains." Strip all of it, add the patterns to the new `.gitignore`, and because it is committed, **rebuild a fresh single-commit history**; a later delete commit still leaves it browsable.

**Do not over-strip.** When a name is ambiguous, read the `SKILL.md` frontmatter and `git grep` whether any cold-outbound skill references it. A referenced file is part of the system. Follow-up, reply-scoring, and pre-call nurture copy all belong to cold outbound despite lifecycle-sounding names.

### Step 5 — Reset the stack to empty (this is what makes the fork reusable)

The new company has not chosen tools. Do not hand them this company's stack as a default. Three things carry a stack, and all three must be reset:

1. **`stack-contract.yaml`** — rewrite with every slot `tool: null`, `status: not_chosen`. Keep the `run_state_field` mappings exactly; 50+ skills read those field names.
2. **`.mcp.json`** — empty the `mcpServers` object. Move the connector definitions to `_vendor-library/mcp-connectors.json` as an activatable catalogue. An auto-connecting MCP server **is** a declared stack, and it is the easiest one to overlook.
3. **`scripts/.env.example`** — strip every tool key. Keep the run-identity and safety variables. The credential registry stays as a *catalogue* of which env vars each known provider needs, explicitly marked as "not a stack".

Then **park, do not delete, the vendor integrations.** Move brand-specific skills to `_vendor-library/skills/<vendor>/` and their scripts to `_vendor-library/scripts/<vendor>/`. Because Claude Code only loads from `.claude/skills/`, a parked pack is inert. The new workspace genuinely ships stack-free, but nothing working is thrown away, and `/stack-setup` can activate a pack in one step if the new company happens to use that tool.

Write a `_vendor-library/README.md` that inventories the packs, says plainly they came from a different company's accounts and are **scaffolds rather than verified integrations**, and documents activation and deactivation.

### Step 6 — Reset identity and doctrine

Rewrite `CLAUDE.md` for the new company. Beyond the name, it must carry:

- **The no-default-stack rule**, pointing at the empty contract, and the instruction to stop and route to `/stack-setup` when a slot is empty rather than assuming a vendor.
- **An explicit override of machine-level global doctrine.** This is the boundary most easily missed. `~/.claude/CLAUDE.md` lives at the **machine** level, not in the repo, so a folder fork cannot change it. If it mandates specific vendors as hard rules, those rules will follow every session into the new workspace and quietly re-impose the stack you just removed. Write a workspace override that keeps the *stack-independent* principles (qualify cheaply before paying to enrich, exhaust the cheapest capable tool before the expensive one, separate discovery from reveal) and explicitly voids the vendor-specific mandates. Then **tell the operator** the global file still says otherwise, and that changing it is a separate machine-level decision affecting their other workspaces. Never edit their global config as a side effect.

Also reset `README.md` and `LEARNINGS.md`.

### Step 7 — Create the repo (GATED outward step)

Only after explicit confirmation of account, name, and **private** visibility:

1. `gh repo create <slug>-gtm --private --source "<target>" --remote origin`
2. **Fresh single-commit history.** Do not carry the source history; it contains the scratch data you stripped in Step 4.
3. `git -C "<target>" push -u origin <branch>`

### Step 8 — Hand-off

Report: folder location, repo URL if created, what was deleted / reset / parked / flagged, that the stack is empty by design, and the remaining work. Then state the boundaries plainly:

- **The stack is empty on purpose.** `/stack-setup` is the required first run.
- **Parked packs are scaffolds**, proven against a different company's accounts, not verified for the new one.
- **Machine-global context is not reset** (Step 6), so two companies on one machine share it.
- **Guided, not turnkey.** Some swaps are manual because tools are baked into platform-specific skills.

## Kept vs stripped (quick reference)

| Kept | Stripped or reset |
|---|---|
| All vendor-neutral cold-outbound skills, scripts, structure, and the flow itself | Secrets, client profiles, campaigns, leads, CSVs (gitignored, never cloned) |
| The stack contract **schema**, with every slot emptied | The source company's **tool choices**: contract values, `.mcp.json` servers, `.env.example` keys |
| Vendor integrations, **parked inert** in `_vendor-library/` | Personal skills, content publishing, operator-specific trackers, named-person meeting prep (deleted, not parked) |
| The credential registry as a *catalogue* of provider env vars | Its framing as a standard stack |
| Skill logic that reads or writes a spreadsheet | Hardcoded **live** Google resource ids, reset to placeholders, including inside parked packs |
| Cost discipline, verification loop, decision rules, copy doctrine | Source branding, internal planning docs, operational scratch, and the git history containing them |

## Safety

- Never authenticate, pay, or accept an OAuth grant on the user's behalf.
- The clone, the overlay, the parking, and the reports are reversible. The repo create and push is the one outward step, and it is gated.
- Secret hygiene: names and placeholders only, never real key values.
- Never modify the source workspace, and never edit the user's machine-level global config as a side effect of a fork.
