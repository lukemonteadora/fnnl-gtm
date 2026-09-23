# Legacy list-quality scorecard script archive (2026-09-24)

**What this is.** `list_quality_scorecard.mjs`, a Node script that graded a verified lead list for `/list-quality-scorecard`. It read `<campaignDir>/leads.verified.csv` (the send file) and, when present, `leads.review.csv`, scored nine dimensions, and wrote `list-quality-scorecard.md` with a letter grade (A to F) and an action line.

It was moved here with `git mv` from `outbound/scripts/`, not deleted. How to restore it is at the bottom. Read the next two sections first, because it does not score a list the way the current skill does.

## What it scored

Nine dimensions, averaged with weights, where verification coverage, source signal integrity and ICP fit counted double:

1. Email verification coverage, hard-set to 100 because the send file is valid-only by construction.
2. Duplicate email rate.
3. Duplicate domain rate (contacts per company).
4. Title relevance.
5. Source signal integrity (`evidence_url`, `signal` and `source_confidence` all present).
6. Bad-title detection (intern, assistant, coordinator and similar).
7. Role or generic mailbox density (info@, sales@ and similar).
8. ICP fit, from a `segment` column or a `fit_status` join against `leads.companies.csv`.
9. Name quality (real first and last name).

## Why it was retired

- **Nothing invokes it.** On 2026-09-24 a search of the whole repo found no caller in `.claude/skills`, `outbound/scripts`, `outbound/reference`, `README.md` or `CLAUDE.md`. The `/list-quality-scorecard` skill's own Script Policy says no bundled scorecard script is required. The only mentions were working docs from the 2026-09-22 alignment (`outbound/reference/working-docs/_AARON-PROCESS-ALIGNMENT-2026-09-22.md` item 8 and `_aaron-alignment-2026-09-22-evidence/edits-list-b.md`), which already flagged that it did not implement the current rules: Dimension 5 as N/A with the weights renormalized, row-level cleanup and quarantine, and the domain-relevance check.
- **It hardcoded one client's buyer.** When a list had no `buyer_tier` column (most lists), title relevance fell back to a fixed finance and decision-maker title regex (CFO, controller, head of finance, FP&A and similar) plus a set of Nordic and Finnish finance-chief titles. That was one earlier client's buyer, carried over from the upstream repo this workspace was forked from. On any other FNNL client it would have scored title relevance against the wrong job family.
- **It carried other upstream leftovers.** Its name-quality note named the upstream workspace's contact vendor, and its notes described off-slice rows being dropped by that vendor at build time. Neither is FNNL's stack.
- **It is superseded.** The list QA now being ported in this same change, `outbound/scripts/list_qa.py`, gates every row on six dimensions before it grades the remainder, and it reads buyer titles through `title_classify.py` against the client's targeting spec (`outbound/reference/targeting-spec-template.yaml`), so there is no hardcoded title family. Keeping the old script next to it would mean two scorers that disagree.

## How to restore it

Move it back to where it lived:

```
git mv outbound/_archive/list-qa-legacy-2026-09-24/list_quality_scorecard.mjs outbound/scripts/list_quality_scorecard.mjs
```

It then runs as `node outbound/scripts/list_quality_scorecard.mjs <campaignDir> [--label "..."]`. Before trusting its grade, replace the finance title fallback with the client's own buyer titles, make Dimension 5 N/A when a list has no signal columns, and update the `/list-quality-scorecard` Script Policy so the skill names it honestly.
