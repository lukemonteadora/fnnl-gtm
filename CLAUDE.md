# FNNL Agency GTM System: Repo Conventions (Claude Code)

This workspace runs cold outbound for **FNNL Agency** and its clients. It is a fresh build: no tech stack is assumed, no clients are configured, and nothing carried over from any previous operator's personal tooling.

---

## 1. There is NO default tech stack (read this before anything else)

Every skill in this repo is written against a **capability role** ("the sending platform", "the contact enrichment tool", "the email verifier"), never against a brand name.

**The single source of truth for which tool fills which role is `outbound/stack-contract.yaml`.** It ships empty.

The rules that follow from that:

- **Never assume a vendor.** If a skill needs a tool and the matching slot in the contract is empty, **stop and route the operator to `/stack-setup`**. Do not pick a plausible tool, do not fall back to whatever a worked example mentions, and do not infer the stack from a name you find in `_vendor-library/`.
- **Never report a tool as working because it is named.** A tool in the contract with status `chosen` has not been proven. Only `live` means a real call against FNNL's own account has succeeded. Treat `chosen` as "not yet usable" when deciding whether to tell the operator something can be automated.
- **Worked examples are not configuration.** Skills contain illustrative examples that may name tools or made-up client names. They teach the shape of a step. They never declare FNNL's stack.
- **`_vendor-library/` is inert.** It holds complete integrations for specific tools, deliberately kept outside `.claude/skills/` so nothing loads. A pack becomes real only when `/stack-setup` activates it. Its presence is not permission to use it.

### Referring to a vendor skill you cannot assume exists

Vendor integrations live parked in `_vendor-library/` and are **not loaded** until `/stack-setup` activates them. So a hard route like "use `/smartlead-inbox-manager`" is a broken instruction in a workspace where that pack was never activated.

When a step needs a platform-specific skill, write it **conditionally**:

> Use the inbox manager for the locked `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one. If no pack is active, use that platform's native surface directly. If neither exists, say so and do the step manually rather than implying coverage.

Name a specific `/vendor-skill` only as a parenthetical example, never as the instruction itself. A dangling route is worse than a vague one: it sends the operator to a command that does not exist, and it quietly reintroduces the assumption that a particular vendor is in play.

### Per-client tools: `run_state`

The workspace contract is the default. Each client's own profile at `outbound/profiles/<slug>/client-profile.yaml` carries a `run_state` block that **locks** the tools for that client's campaigns, inheriting from the contract.

`run_state` field names (`run_state.sending_platform`, `run_state.registrar`, `run_state.mailbox_provider`, `run_state.infrastructure_stack`, `run_state.research_routing`, `run_state.execution_mode`, `run_state.spend_ceiling_usd`, and the rest) are **load-bearing across 50+ skills**. Never rename them. Change what fills them, never what they are called.

---

## 2. Workspace-level override of global doctrine (IMPORTANT)

The machine-level Claude config at `~/.claude/CLAUDE.md` contains cold-outbound doctrine written for a **different company's stack**. Most visibly, it mandates an "A-Leads-first, exhaust-then-gap-fill" routing rule as a hard rule, and names specific vendors as the signal architecture.

**Inside this workspace, that vendor-specific doctrine does not apply.** FNNL Agency has not chosen a contact-data provider, so a rule that mandates one cannot be followed here.

What survives from it, because it is stack-independent and genuinely good practice:

- **Cheap-qualify-before-enrich.** Filter the company universe on free or cheap firmographic data before paying per record. Never pay to enrich a bad-fit company.
- **Exhaust-then-gap-fill ordering.** When more than one tool can return the same data point, run the cheapest capable tool across the whole set first, then route only the still-empty cells to the more expensive one. This is a *shape*, not a vendor mandate. The order comes from `stack-contract.yaml`, specifically the waterfall recorded in `lead_data.contact_enrichment.notes`.
- **Company signals join onto contact rows**, so each contact carries both its own signals and its company's.
- **Separate contact discovery from email reveal**, so a slice can be qualified before anyone pays per contact.
- **Contact-level why-now signals generally outperform company-level ones** at equal viability, and the strongest campaign slices stack one of each.

What does **not** apply here: any rule naming a specific vendor as required, any minimum-volume floor tuned to another company's economics, and any claim about a specific tool's coverage or behavior.

If a global rule and this file conflict, **this file wins for work inside this workspace**. Resetting the machine-level config is a separate decision that affects other workspaces, so do not edit it as a side effect of work here.

### The global file also names paths that do not exist here

`~/.claude/CLAUDE.md` was written against the upstream folder layout and hardcodes three paths. In this workspace they resolve as:

| Path in the global file | Here |
|---|---|
| `02-skills/coldoutbound-skills/profiles/<client>/activity-log.md` | `outbound/profiles/<client>/activity-log.md` |
| `02-skills/coldoutbound-skills/client-activity-log.md` | `outbound/reference/client-activity-log.md` |
| `02-skills/coldoutbound-skills/_intent-data-evaluation.md` | **Does not exist.** Upstream internal doc, deliberately not forked. Ignore the reference. |

The read-first / write-after activity-log protocol itself still applies in full. Only the paths differ.

---

## 3. Where things live, and how paths resolve

**Skills live in `.claude/skills/<name>/SKILL.md`** at the repo root. That is the single source of truth for every skill. Edit them there; Claude Code loads them live. There is no second copy and no account upload.

**One exception: the four persona-consult skills are mirrored, not owned here.** `ask-aaron`, `ask-eric`, `ask-nate` and `ask-taylor` are byte-identical copies of the canonical versions in `Documents/Personal GTM System/.claude/skills/<name>/`. **Do not hand-edit them in this repo.** Edit canonical, then run `Personal GTM System/sync-mirrored-skills.ps1` (`-Check` verifies parity and completeness without writing). The full rule lives in the global `~/.claude/CLAUDE.md` so it loads from every workspace, not just this one. Because they must stay byte-identical across repos, these four contain no absolute paths and degrade gracefully when a resource exists in another workspace but not here.

**These four do not breach section 1, and here is why.** Their doctrine files quote real practitioners who name real vendors constantly, so you will see brand names in them. Each doctrine carries its own tech-agnostic rule instructing the persona to **keep the principle and drop the tool name**, which is the same discipline section 1 already demands. Treat a vendor named inside a persona's doctrine exactly as section 1 treats a worked example: it teaches the shape of a position and **never declares FNNL's stack**. A persona may not select a tool, activate a `_vendor-library/` pack, or fill a slot in `stack-contract.yaml`. They are advisory only and cannot touch live systems, so if a consult concludes "you need a sending platform", the route is still `/stack-setup`.

**When creating a new skill:** create `.claude/skills/<slug>/SKILL.md`, where the folder name is the command (`/<slug>`), with YAML frontmatter containing `name:` (matching the folder) and `description:`.

### The whole repo, in one table

| Path | Contents |
|---|---|
| `.claude/skills/` | The 57 active skills (53 owned here, plus the 4 mirrored persona-consult skills). Claude Code loads these live. |
| `outbound/` | Everything the skills read and write. Detailed below. |
| `_vendor-library/` | Parked tool integrations. **Nothing here loads**, by construction. |
| `library/` | Third-party PDFs and DOCX for human reading. No skill reads this. |
| `client-assets/` | Client deliverables. Gitignored, local only. |

Two rules keep that honest. Anything a skill needs at runtime lives under `outbound/`. Anything under `library/` is inert: if a skill ever needs it, move it into `outbound/reference/` rather than referencing it in place.

**Skill data and reference docs live under `outbound/`:**

| Path | Contents |
|---|---|
| `stack-contract.yaml` | **FNNL's tool and process contract. The stack source of truth.** |
| `profiles/<client-slug>/` | Per-client profiles, campaigns, artifacts, activity logs. Gitignored. |
| `scripts/` | Automation scripts, `.env` (gitignored), `credential-registry.json` |
| `memory/` | Skill state files |
| `reference/` | Every doc a skill *reads*: copy doctrine, rubrics, client-facing templates, setup guides |

### Path-resolution rule

When a skill references `profiles/<slug>/...`, `scripts/...`, `memory/...`, or `stack-contract.yaml`, **resolve it under `outbound/`**, not the current working directory and not `.claude/skills/`.

When a skill references a **bare reference-doc filename** (`cold-email-copy-best-practices.md`, `output-style-guide.md`, `campaign-approval-brief-template.md`, `client-activity-log.md`) or a `reference/...` path, **resolve it under `outbound/reference/`**.

`<outbound>` written in a skill means the same thing explicitly: the root of this data library, wherever the repo happens to be checked out. Never hardcode an absolute path. A reference of the form `/<name>` means the `/<name>` skill in `.claude/skills/`. `_vendor-library/` and `library/` resolve from the repo root.

This indirection means skills never need their internal references rewritten when files move.

---

## 4. Client activity log: read first, write after

For any client work in this workspace:

1. **Read first.** At the start of work on a client, open `outbound/profiles/<client>/activity-log.md` and read its **CURRENT STATE** block before doing anything. It says what was last done, what is pending, what is blocked, and what is complete, so a fresh session never loses the thread or redoes work. If the file does not exist, create it from the template in `client-activity-log.md`.
2. **Write after.** After any material step, append a one-line entry (newest first) to the `LOG` and refresh `CURRENT STATE`. Keep entries short and status-oriented (CREATED / UPDATED / EXISTS / PENDING / BLOCKED / DONE / CANCELLED / NOTE). Record status, not raw dumps, and point to the detailed artifact.

---

## 5. Getting started in a fresh workspace

Run these in order. Each one refuses to guess what the previous one should have established.

1. **`/stack-setup`**: define FNNL's tools and process. Everything else depends on this.
2. **`/preflight-credentials`**: confirm the keys for the chosen stack actually resolve.
3. **`/cold-email-kickoff`**: onboard the first client.
4. **`/continue-client`**: resume a client mid-flight.

`/cold-email-starter-kit` is the orientation router if you are unsure where to begin.

---

## 6. Communication & Output Style

Everything written for the operator and for clients should be quick to understand for a smart person who is not a cold-email specialist. This covers chat replies, the questions and options offered mid-skill, status updates, and the reports, approval briefs, and presentation files that skills produce.

This governs *how* things are explained and formatted. It does not change any skill's steps, logic, decisions, or QA rules.

**HARD RULE: never use a spaced em dash.** Do not write an em dash or en dash with spaces around it, anywhere: chat replies, options and questions, status updates, reports, approval briefs, presentations, documents. Use a period and a second sentence, a comma for a short aside, parentheses for a true aside, or a colon to introduce something. Normal hyphens inside compound words (pre-warmed, thread-aware, 90-day) are fine. This rule is absolute.

**Lead with the point.** Say what matters first in plain words, then add the detail. Do not bury the takeaway under setup or tool chatter.

**Write for a sharp outsider.** Assume the reader is intelligent but new to cold outbound. Keep the real industry terms so the content stays credible, but the first time a term appears, add a short plain gloss right after it. For example: "warmup (the gradual ramp-up that builds a mailbox's reputation before real sending)."

**Keep buzzwords honest.** Use jargon when it is the precise word, not to sound technical. If a plain word does the same job, use the plain word.

**Right-size it.** A status update is two or three sentences. A real decision gets enough context to act on. Do not dump everything, and do not be so terse it turns cryptic.

**Write in full sentences.** Let the explanation breathe. Do not cram two thoughts into one line just to make it shorter.

**Sound like a person explaining it.** Direct and natural. Contractions are fine. Picture explaining it to a colleague who is good at their job but new to this niche.

**Format so it can be scanned.** Short paragraphs. A bold lead line when it helps. Bullets for real lists, not to chop one sentence into fragments. Headers on longer documents.

When offering options, say three things for each: what it is, what happens if it is picked, and for the recommended one, why. For reports, approval briefs, and presentations: open with a line or two on what the document is and what the reader is meant to do with it, define key terms on first use, and keep a clear spine of what we did, what we found, what it means, and what we need from you.

Fuller guidance and a plain-English glossary live in `outbound/reference/output-style-guide.md`.

---

## 7. Standing rules

### Decisions

At any material decision point (strategy, cost, provider routing, source of truth, list quality, campaign direction, client-facing output, live systems, risk exposure): **name the realistic options, give a recommendation with a reason, say briefly why the alternatives are weaker, then ask or proceed.** Ask when the choice affects spend, live systems, provider changes, compliance risk, or client-facing deliverables. Proceed on low-risk reversible choices. Never silently pick a material path.

Use native Interactive Inputs where the runtime supports them, with the recommended option first and a custom-answer option last.

### Verify before declaring done

Before reporting that anything is done, live, sent, uploaded, applied, or built: **prove it against the system that holds the truth.** A tool returning success is acceptance, not proof of outcome. Across a batch, check count and coverage of the whole set, not that the action ran once. Report the evidence alongside the verdict ("verified: 487/487 leads on campaign 12345"). If only part completed, say so at the top. Never round a partial up to done. `/verify-execution` carries the full loop.

### Stress-test opinions

When giving a strategy, plan, or recommendation, surface the strongest case against it and rule on it (fatal / fixable / acceptable risk). Label guesses as guesses. Do not fold under pushback if the point still stands, and do not agree reflexively. `/roast` gives a hands-off verdict; `/consultant` is the interactive version.

### Parallelize independent work

When work splits into two or more pieces with no shared state and no ordering dependency, fan them out across sub-agents in one message rather than grinding serially. Partition inputs so no two agents get the same item, give each its own output target, then de-duplicate after merging. Going serial on genuinely independent work needs a stated reason. `/personalization-subagent-pattern` is the canonical implementation.

### Spend

Anything that costs money routes through `/api-cost-governance` and respects `run_state.spend_ceiling_usd`. The workspace default is a zero ceiling, meaning confirm before every paid call. Raise it only on an explicit instruction, never silently.

### Secrets

Real API keys live only in `outbound/scripts/.env`, which is gitignored. Never write a real key into any tracked file, never ask the operator to paste one into chat, and never authenticate or purchase on their behalf.
