# DOCX approval-brief builder archive (2026-09-24)

**What this is.** `campaign_approval_brief.ps1`, the PowerShell script that built the campaign approval brief as a Word document. The approval brief is now a locked 10-slide PPTX deck, authored by `/campaign-approval-brief` and rendered by `outbound/scripts/approval-brief-pptx/`. That skill does not call this script.

It was moved with `git mv` from `outbound/scripts/`, not deleted. To restore it, move it back there. Read the next section first, because it will not work on current clients as it stands.

## Why it was retired

- **Nothing invokes it.** On 2026-09-24 a search of `.claude/skills`, `outbound/scripts`, `outbound/reference`, `README.md` and `CLAUDE.md` found no caller. The only mentions were guard paragraphs in other skills describing it, the `campaign_approval_brief_needed` intake field in `/client-intake-form` (a yes/no flag, not a call), and working docs under `outbound/reference/working-docs/` that record earlier edits.
- **It parsed headings that no producer writes any more.** From `lead-magnets.md` it read `## Primary Offer`, `## Secondary Offer` and `## Archived / Not Selected`. `/lead-magnet-brainstorm` now writes `## Fulfillment plan`, `## Validation arms` and `## Every candidate`. From `offer-intelligence.md` it read `**Avoid:**`, which `/offer-intelligence` now writes as `**Rank lower:**`. So on any client built under the current skills, its offer-alternatives section would come back empty with no error.
- **It hardcoded one earlier client's campaigns,** carried over from the upstream repo this workspace was forked from: a `new-cfo-benchmark` campaign slug with its own role text and decision ask, the offer name "Billing Gap Observation", the "hiring-signal" and "new-CFO" offer labels, a benchmark ask naming "4-6 Nordic SaaS customers", and a canned "Why These Campaigns" paragraph describing that client's three campaigns. None of it belongs to an FNNL client.
- **A second builder next to the PPTX pipeline meant two readers of the same files drifting apart**, which is exactly what happened. Updating it would have meant maintaining that duplicate for a format the brief no longer ships in.

## What the guard text got wrong

The guard text in `/data-point-discovery` and `/cold-email-kickoff` said the script returned empty on a missing catalog and still exited 0, so a renamed heading would silently empty a deck section. The archived copy does not do that: it throws (stops with an error) when `data-point-catalog.md` is missing, when no row parses under `## Ranked Source Signals`, or when `- **Source risks:**` has no value. The guard text had drifted from the script it described. With the script retired, the point is moot, and the replacement guards below describe the live readers instead.

## What changed alongside it

Guard text in other skills that protected strings "because the script parses them" was pointed at the readers that actually use those strings today. The guards were kept where a live reader exists, and dropped where only this script needed them.

- **`/cold-email-kickoff` (Step 3.3) and `/data-point-discovery` (description, Output, Stop Gates, Related Skills).** The catalog heading `## Ranked Source Signals` is looked up by name by `/campaign-strategy` and `/lead-source-strategy`, and `/cold-email-flow-audit` treats a catalog without it as stale. The `- **Source risks:**` bullet stays in the catalog's definition-of-done. The rules that existed only for this script were removed: its regexes, the "fails silently" warning, the `Rank` column as a load-bearing skip-list entry, the "deck prints columns 2 and 3" rule, the one-table rule, and "change the regex in the same commit." The claim that the approval deck reads its source section from the catalog was corrected: the deck's source slides come from each campaign's `lead-source-plan.md`, and the catalog is background only.
- **`/cold-email-flow-audit`.** Its stage table no longer calls the catalog the file the approval deck reads its source section from.
- **`/lead-source-strategy`.** The bold `**Label:**` fields are still required, because the `/campaign-approval-brief` pre-flight looks them up and stops when one is missing.
- **`/campaign-copywriting`.** The `body: |` block-scalar rule for `variants.yaml` now names `scripts/campaign_docx_presentation.ps1`, which still reads that file line by line.

## Left as it was

- `outbound/scripts/brief_md_to_docx.ps1`: also a retired DOCX renderer, but the approval-brief template deliberately keeps it on disk for history. That is a separate decision.
- Working docs under `outbound/reference/working-docs/` that mention this script are history and stay as written. So are the pre-change skill snapshots in the other `outbound/_archive/` folders, which still carry the old guard wording.
