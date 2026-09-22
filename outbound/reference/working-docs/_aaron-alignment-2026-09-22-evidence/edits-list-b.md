# Change log: group list-b, FNNL port (Aaron process alignment, 2026-09-23)

**What this is.** Every edit the list-b agent made to FNNL's four list skills while porting the operator-approved Aaron process alignment from A-Sales. Each row gives the new line number, the rule it implements (section 3 of `fnnl-edit-instructions.md`), and where FNNL stated the old rule. Nothing was committed. No sub-agents were used.

**Method.** Diffed each A-Sales archive copy against commit `56ff4a2c` (lead-scoring against 56ff4a2c too), named the rule each hunk changed, found FNNL's own statement of it, and rewrote it in FNNL's wording with capability roles. No A-Sales sentence was pasted whole: A-Sales brand names (Deliverable.co, A-Leads, DiscoLike, GetLeads, BlitzAPI, QuickEnrich) became roles ("the email verifier", "the company discovery tool", "the contact-discovery source"), and "shared sender pool" became FNNL's per-client fleet.

**Archives (made by the coordinator, untouched):** `outbound/_archive/aaron-process-alignment-2026-09-23/{email-waterfall,lead-scoring,lead-source-strategy,list-quality-scorecard}--pre-change.md`.

---

## 1. `.claude/skills/email-waterfall/SKILL.md` (341 -> 347 lines)

| New line | Change | Rule (s3) | FNNL old wording |
|---|---|---|---|
| 3 | Description: "Process P1 first, then P2 through P5 as capacity opens" replaced by: first-wave confirmed slice = whole scored, eligible TAM, one pass, P1 to P5 as processing order only, every tier ships, $100 budget still stops and asks; "Email yield is never a send gate". YAML parses. | Lists: P1 to P5 send order; whole TAM is the confirmed slice; 80% stop deleted | old line 3 |
| 34 | Layer-2 framing now "runs on the confirmed campaign slice ..., never during the TAM build itself". Old "not across the whole TAM ... only for the slice that is going live ... never up front across the entire TAM" removed (with its 2 spaced em dashes). | Whole TAM is the confirmed slice | old line 34 |
| 36 | New paragraph: in the first wave the confirmed slice is the whole scored, eligible TAM; one pass, every tier; score order is processing order, never a release schedule; Aaron Sep 21 as the model. States what does not change: the TAM-build no-reveal firewall, the finder-then-verifier-then-residue order, the tool order the stack contract records, the $100 stop. Labelled with `supersedes` clause for the 2026-06-29 wording. | Same | new |
| 80 | Inputs: `source_arm` added (defined in `/lead-source-strategy`; `source` still names the vendor). | Lists: multi-source `source_arm` | Inputs list (old 67-86) |
| 87 | Inputs: `service_offered`, `service_offered_source`, `own_best_client`, `own_best_client_source`, derived by Claude sub-agents per `/personalization-subagent-pattern`, never a list workbench AI column; blank when unused. | Copy: per-contact variables (6f); FNNL adaptation (s5) | new |
| 101 | Lead-scoring spend gate: "Lower tiers stay queued and are never deleted" replaced by "processing order only ... no tier is held back or deleted", labelled with `supersedes`. | P1 to P5 send order | old line 97 |
| 112 | Scrape-all title filter also names the offer-generated stack `offer.title_stack` when the offer lock wrote one. Scrape-all itself unchanged. (From the A-Sales hunk, not the group note.) | Offer writes `offer.title_stack`; Seeds: every title variation | old line 108 |
| 114 | "not licence to reveal emails across the TAM" narrowed to "during the TAM build, before any campaign is confirmed"; adds that the confirmed slice in the first wave is the whole scored, eligible TAM. | Whole TAM is the confirmed slice | old line 110 |
| 126 | "a Tier-2 step run on the winning slice" became "run only on campaign-confirmed contacts". Rename only: the "whole eligible TAM" clause was deliberately NOT appended, because this line is deep contact *research* depth, not email reveal (A-Sales kept its "winning slice" here as correct in context; this port renames per the group note but does not widen research to the whole TAM; `deal_value_tier` sets research depth). | Group note ~122 | old line 122 |
| 138 | HARD RULE (2026-06-29) kept as the firewall; step (3) now states that in the first wave the confirmed contacts are the whole scored, eligible TAM (every tier, every offer cell), one pass in score order, with `supersedes` clause. "(confirmed slice only, never the TAM or contact-TAM)" became "(confirmed-campaign contacts only, never the TAM or contact-TAM build)". | Whole TAM is the confirmed slice | old line 134 |
| 238 | Required Order step 2 preserve list: `source_arm` plus the four per-contact variable columns added. | `source_arm`; 6f | old line 234 |
| 262 | FNNL-only extra statement: "run it on the campaign slice that is going live, never across the whole TAM" (waterfall enricher) became "run it only on the residue of the confirmed campaign contacts (in the first wave, the whole scored, eligible TAM), never during the TAM or contact-TAM build". | Whole TAM is the confirmed slice | old line 258 (FNNL-only; A-Sales's analog was its gap-fill rung line 251) |
| 286 | Budget stop kept word for word, plus: a first-wave reveal is previewed across the whole eligible TAM, never a P1-only cut; over budget it stops and asks with the whole-TAM reveal and verification cost; never silently shrink to a top-tier slice. | Kept: $100 stop-and-ask (a whole-TAM reveal over budget still stops and asks) | old line 282 |
| old 289 | **Deleted** the 80% survival stop ("Fewer than 80% of the original sourced rows survived ... do not send a thin list"). | 80% email-yield stop deleted | old line 289 |
| 293 | Scorecard upload condition kept at grade B or better, reworded: "the send file", and the scorecard removes or quarantines failing rows first and grades the remainder. Its 1 spaced em dash removed. | Scorecard row-level first (consistency) | old line 290 |
| 295 | New note: email yield is not a send gate; `no_email` rows to `leads.review.csv`, catch-alls to the holdback, every verifier-`valid` row ships; judge a source on fit, bounce and reply; Aaron Sep 21 shipped at about 61%. Labelled with `supersedes` quoting the retired stop. | 80% stop deleted | new |
| 321 | Report: new "Yield" line, source evidence only, never a gate. | 80% stop deleted | Report list |

**Left unchanged on purpose.**
- The no-reveal firewall during the TAM build, the finder-then-verifier-then-residue order, the Verification Doctrine, Catch-All Timing, the cache tier, the SANCTIONED EXCEPTION and NO PRE-EMPTIVE SKIP rules, the SERP-discovery ban, the list workbench section: all kept, per the group note.
- The two-contact same-wave cap and the rank 3+ stagger (lines 116-118): a per-company send-simultaneity rule, not a tier hold, so "every tier ships in the first wave" does not touch it. Stated explicitly in lead-scoring line 240 so an auditor does not misread it.
- Stop gate "Any ineligible, suppressed, hard-no, or rank 3+ same-company row leaked into the active wave": still correct, it guards the paid queue.
- The contact-discovery-signals HARD RULE (line 105 onward): free Layer-1 fields that come with the rows; conditional paid signals are owned by list-a.
- The "on hold" balance paragraph ("if the live balance cannot cover this slice, top up first"): generic, still true.
- Pre-existing spaced em dashes on lines I did not rewrite (Interaction Policy, Activity Log, the "100% verification-checked" stop gate line).
- Pre-existing broken fragment "Full doctrine:." (line 120): not part of this spec.

**Absent in FNNL (logged, not imported):** none of the A-Sales hunks lacked an FNNL analog. FNNL's description never named the finder order, so the A-Sales description's tool list had nothing to port.

## 2. `.claude/skills/lead-scoring/SKILL.md` (302 -> 309 lines)

| New line | Change | Rule (s3) | FNNL old wording |
|---|---|---|---|
| 136 | "Rebuild only when the ICP or offer changes" adds: an offer arm added to a live wave is a background rescore of the offer component (see Refresh). | Winner-pick / arms swapped in flight (Mar 9) | old line 136 |
| 240 | "All eligible tiers remain in the queue. Reveal and verify P1 first, then P2 through P5 as capacity becomes available" replaced: every eligible contact goes out in the first wave in score order; P1 to P5 is send order, never a hold; `/email-waterfall` reveals and verifies the whole eligible TAM in one pass. Labelled with `supersedes`. Same-wave two-contact cap and rank 3+ stagger kept, with an explicit note that the cap is a send-simultaneity guard, not a tier hold. | Lists: P1 to P5 send order | old line 240 |
| 242-245 | New "Capacity means two named limits": send capacity = `run_state.capacity_request.allocated_daily_sends`, the daily sends the client's warmed, active fleet delivers; `/campaign-strategy` writes the request with the wave (`daily_sends_needed` = qualified contacts x steps / ~5 Monday-to-Friday sending days); `/mailbox-mix-strategy` sizes the fleet to it or `/mailbox-pool-staging` assigns a pool group; a smaller fleet stretches the runway. Run budget = `run_state.spend_ceiling_usd` ($100); a whole-TAM reveal over it stops and asks in `/email-waterfall`. FNNL per-client fleet wording, no shared pool. | Reversal 3 (capacity sized to volume); 6b | new |
| 247 | New required coverage line at the end of `lead-scoring-report.md`, appended by the session because `scripts/lead_score.py` has no capacity input: eligible contacts, days to cover at the allocated rate (Monday-to-Friday days), whole-TAM reveal cost vs `spend_ceiling_usd`, and which limit binds. Handles the usual ordering (lead-scoring runs before campaign-strategy): "send allocation not yet filed"; never writes `capacity_request`. | Reversal 3; P1 to P5 send order | new |
| 273 | Refresh: the hard block now fires when the ICP changes or the locked offer set is replaced by a new lock. The existing winning-arm carve-out (operator decision 2026-09-22) is extended to a new offer arm or variant added to a live wave: background rescore of `offer` only, live cells keep sending, the new `score_version` orders only rows not yet first-touched (Aaron, Mar 9). | Arms swapped in flight | old line 266 |
| 295 | Stop gate extended: also fail loud when a downstream step holds any eligible tier out of the first wave. | P1 to P5 send order | old line 288 |

**Left unchanged on purpose.** The frontmatter description ("score-ordered enrichment and outreach" is still true), the 10-point shell, exclusions, calibration, confidence, output contract, tier bands, the list workbench section, and the Downstream rules (already "ordering only"). Line 8 ("never ... deletes lower but marketable tiers") is consistent and was left alone.

## 3. `.claude/skills/lead-source-strategy/SKILL.md` (381 -> 408 lines)

| New line | Change | Rule (s3) | FNNL old wording |
|---|---|---|---|
| 3 | Description: adds that a first wave may split across two or three parallel sources (the lookalike spine, a broad offer-relevant filter, a signal source) with disjoint rows tagged source_arm. FNNL's "every tool it names must be one the stack contract declares" kept. YAML parses. | Lists: multi-source `source_arm` | old line 3 |
| 21 | FNNL's "Defaulting to whichever contact database or maps scrape is easiest is weak thinking" extended to a titles-plus-headcount pull with nothing offer-relevant behind it (Aaron, Sep 21). "Offer-test exception" became the **offer-relevance exception**, widened to any strong-offer, wide-TAM campaign including a validated offer's scale-up (Aaron, Sep 14), with `supersedes` clause. Allowed answer "not needed, offer test" became "not needed, offer-relevant broad list". "doctrine §5" citation kept (A-Sales coordinator's row-25 ruling). | Audit row 10 (A-Sales hunk) | old line 21 |
| 97 | Core Rule delivery-capacity line: offer lock covers capacity (scale note or `offer.qualification`); scale review sets how many qualified yeses get the free unit rather than gating list volume; carve-out where the client literally supplies the deliverable. | Reversal 1; "each offer deliverable at send scale" | old line 97 |
| 111 | Source question 7 is now "Does this signal make the list more relevant?" (Aaron, Mar 2); copy reference is a separate optional check (evidence_url, not fake, creepy or overfit). `supersedes` clause. | Audit row 24 (A-Sales hunk) | old line 111 |
| 116 | "a generic database pull is probably the lazy path" narrowed to a titles-plus-headcount pull with no offer relevance; a broad pull is not the lazy path when the offer makes the list relevant. | Audit row 10 | old line 116 |
| 176 | New paragraph above the routing table: industries reach a pull as an AI-generated keyword stack generated by Claude Code from the locked offer and ICP (Aaron, Apr 13), never a provider industry taxonomy and never a list workbench AI column; `industries_out` stays a named exclusion list, mapped to a tool's taxonomy only to exclude; `/tam-build` builds the stack for the TAM pull and a source plan reuses it. | Lists: keyword stacks replace taxonomy filters (FNNL: Claude Code, never an AI column) | new (FNNL never stated the old rule as an instruction; see Absent) |
| 192-202 | New subsection "Multi-source first wave": two or three sources in parallel from launch (Aaron, Apr 13); the offer-fit lookalike from `lead_data.company_discovery` stays the spine and the Primary Source Path; disjoint rows by `company_domain` with a first-named-arm tie rule (lookalike by default); arms already inside the TAM tagged from its discovery provenance; every row tagged `source_arm`, which travels through the list workbench push; read offer by source under `/experiment-design`; a source arm judged on fit, bounce and reply, never find rate; backup can be a live arm; an arm outside the approved stack is "OUT OF STACK, needs operator approval". Roles only, no brand. | Lists: multi-source `source_arm`; operator ruling "lookalike stays the spine" | new |
| 227 | Template "Why this list should care now": label kept (parsed), guidance now optional, "offer relevance" when no why-now exists. | Audit row 10 | old line 214 |
| 253 | Template "Why this beats a generic database pull": allowed value "not needed, offer-relevant broad list" for Offer-Validation Wave cells and any strong-offer, wide-TAM campaign. | Audit row 10 | old line 240 |
| 264-265 | Backup Source Path: new `**Live arm:**` label; `**When to switch:**` label kept verbatim (the approval brief parser reads it at `campaign_approval_brief.ps1` 396 and 458), guidance "n/a, running as a live arm" for a live arm. | Multi-source | old line 251 |
| 267-275 | New optional `## Parallel Source Arms` template section (source family, tool from the stack contract, arm tag, disjoint-row rule, expected volume). | Multi-source | new |
| 311 | QA template "Stop if": never an email-yield floor; a source is judged on fit, bounce and reply. | 80% stop deleted (keeps plans from re-adding it) | old line 287 |
| 325 | Critical format note names the optional `## Parallel Source Arms` section too. | Consistency | old line 301 |
| 335, 340 | Required CSV fields: "A multi-source first wave adds `source_arm`", and `source_arm` defined (`lookalike`, `broad_filter`, `signal_<name>`; blank on a single-source plan), separate from `source` (still the vendor). | Lists: `source_arm` (not `source`) | CSV fields (old 303-319) |
| 367 | FNNL sweep (A-Sales left its copy of this line alone because tam-build owned it): the Quality Rules two-motion rule said the proven motion seeds from "the client's validated case-study / customer companies" and that a **broad ICP filter** is the expansion motion "for a segment the client has not sold to yet or a brand-new offer with no proof". Now: seeds are the 5 to 10 companies that best fit the locked offer (offer-fit case studies and customers first, topped up with researched offer-fit exemplars); a new segment or a brand-new offer with no proof is seeded from exemplars, never a bare category filter; the lookalike widens while fit holds; the broad ICP filter (carrying the keyword stack and `industries_out`) is the last widening rung, never the spine. `supersedes` clause. | Seeds (s3); keyword stacks | old line 340 |

**Left unchanged on purpose.**
- `## Primary Source Path` / `## Backup Source Path` headings and every existing bold label (parsed by `outbound/scripts/campaign_approval_brief.ps1`).
- The routing table rows, including "Title + industry only" and "Known good customer lookalikes": they carry pre-existing brand names (Prospeo, A-Leads, WizLeads, DiscoLike, Serper and others) that s5 says to leave, and the new keyword-stack paragraph above the table governs how any of them filters on industry. The lookalike row's "seed the lookalike from the client's validated case-study companies" still reads true (case studies lead the seeds) and points to Quality Rules, which now carries the full seed rule.
- "For lookalike campaigns, use DiscoLike first ..." and the Tool Role Separation item 4 (brand-heavy, pre-existing, not a superseded rule).
- "Do not enrich thousands of rows until the source sample shows at least 40% ICP fit" and "Do not reference a signal in copy unless the row has an `evidence_url`": still correct.
- The "Events enter as a company signal" rule ("displace the case-study-seeded lookalike"): still correct in spirit; the seed wording is now owned by the Quality Rules line above it.

**Absent in FNNL (logged, not imported):**
- A-Sales line 30 "Email finding (winning slice only, blank rows only)": FNNL has no such line. Its Enrichment Path template says only "**Email finding:** <Waterfall sequence>" and Tool Role Separation item 4 states no slice scope. Nothing to change.
- A provider industry-taxonomy filter as an instruction: FNNL never tells the operator to filter on a taxonomy. The keyword-stack rule was added fresh (line 176) because the group note assigns it here and the spec adds it for this phase.

## 4. `.claude/skills/list-quality-scorecard/SKILL.md` (235 -> 264 lines)

| New line | Change | Rule (s3) | FNNL old wording |
|---|---|---|---|
| 3 | Description: row-level first (drops or quarantines suppressed, duplicate, broken-name, bad-title, domain-mismatch rows, grades the remainder); whole-list block only on systemic failure (unverified rows, SERP-sourced or pattern-named contacts, exclusion or scoring leakage). YAML parses. | Scorecard row by row first | old line 3 |
| 10 | New "Row-level first" rule with Aaron Sep 21 evidence (151 suppressed, 150 broken names removed, then shipped); grade B gate applies to the remainder; `supersedes` clause. | Same | new |
| 58-61 | Output list: systemic check result, row-level cleanup summary, grade on the remainder, Dimension 5 may read N/A. | Same; dim 5 N/A | old 56-57 |
| 66 | New: the scorecard rewrites the send file (`leads.verified.pre-scorecard.csv` kept; remainder back to `leads.verified.csv`; quarantine to `leads.review.csv` with `review_reason = scorecard_<check>`, adding the `review_reason` column when the file does not carry one yet, because `leads_split_verified.mjs` writes none; same-wave overflow to the stagger queue; nothing deleted). FNNL-specific addition: the list workbench's send-list table still holds the pre-scorecard rows (a webhook push appends and cannot remove), so the scorecard states the removed count and the operator filters them there; the upload reads the local file. | Same; FNNL list workbench rule | new |
| 76-95 | "Lead-scoring integrity gate" restructured as **Step 1: systemic blocks** (unverified rows via the email verifier, SERP-sourced or pattern-named contacts, exclusion or scoring leakage) and **Step 2: row-level cleanup** (suppression match dropped, duplicate emails dropped, `same_wave_eligible != true` back to the stagger queue, broken names / bad titles / domain mismatches quarantined, unsupported signal lines moved to the offer-led variant; role mailboxes graded by Dimension 7, not removed). FNNL's old gate bundled "a suppression match" and "`same_wave_eligible != true`" into the whole-list fail; both moved to Step 2. The Step 2 suppression bullet (line 88) says `/email-waterfall` already stops before paid spend on a suppressed row, so a scorecard match is one added after that check: the waterfall's stop gate stays a hard stop and the scorecard's drop does not contradict it. "Report the score distribution" paragraph kept. | Same | old 70-80 |
| 110 | Dimension 2: duplicates dropped in Step 2, remainder normally 100, pre-cleanup rate to the summary. | Consistency | old 93 |
| 123 | Dimension 4: unrelated role is scoring leakage, forcing the Step 1 block (was "force the integrity gate to fail"). | Consistency | old 106 |
| 125-129 | Dimension 5 scored only when the copy references (or the plan says it will reference) a row-level signal; otherwise N/A, dropped from the weighting; re-score if later copy adds a signal line. Aaron's scorecard checks relevance (Sep 21) and his lists often carry no signal (Sep 14). `supersedes` clause. | Dim 5 N/A unless copy cites a row signal | old 108-111 |
| 136 | Dimension 6: bad titles quarantined in Step 2, remainder normally 100. | Consistency | old 118 |
| 150 | Domain relevance folded into Dimension 8 (ICP fit): email domain matches `company_domain`, which is the scored ICP company; mismatches quarantined as `scorecard_domain_mismatch`; marked as the house's reading since Aaron names the check without defining it (Sep 21). Not a 10th dimension, so "9 dimensions" stays true. | Domain-relevance check inside ICP fit | new |
| 157-158 | Dimension 9: broken names on individual rows quarantined, remainder graded; pattern- or index-constructed names from a discovery source and SERP-sourced sets stay systemic blocks. Its 1 spaced em dash removed. | Row-level first | old 138-139 |
| 169 | Weighting computed on the remainder; with Dimension 5 N/A the total weight drops from 12 to 10. | Dim 5 N/A | old 150 |
| 177 | F row: "Don't send. Rebuild the list." became "Don't send this remainder ... find it, fix it upstream, and re-run." | Row-level first | old 158 |
| 184-219 | Example output rewritten: systemic check, row-level cleanup (2,147 -> 1,991), graded remainder with Dimension 5 N/A. Arithmetic checked: dims 1 and 8 at 100 x2 = 400, dims 2, 3, 4, 6, 9 at 100 = 500, dim 7 at 50 (119/1,991 = 6.0% role mailboxes, inside the 5 to 15% band) = 50; 950 / 10 = 95, grade A. Removals sum to 156 (23+31+64+12+18+8). FNNL's old example mislabelled Dimension 7 as "Catch-all density"; the new example uses "Role mailbox density". `grep "Catch-all density"` outside `_archive/` returns nothing. FNNL's catch-all holdback checklist line kept. Provenance written as a role ("a current-employer contact database"), no brand. | Row-level first; dim 5 N/A | old 165-192 |
| 247-251 | What to do next: a below-B remainder is quarantine-then-regrade; a systemic block routes back to the owning skill; a large Step 2 drop share means ship the remainder and fix the source for the next batch. | Row-level first | old 220-222 |

**Left unchanged on purpose.**
- The `<100 contacts` sample-size line (now line 230): byte-identical to the archive (md5 `7146523cc96e024d457e8cce6b6734be` on both).
- The grade-B upload threshold itself (many downstream gates read it).
- Dimension 1 text (pre-existing Deliverable.co / BetterContact brand mentions, left per s5), Dimension 3, Dimension 7's bands, Dimension 9's provenance-check text (pre-existing A-Leads / ContaGen / Prospeo mentions), the LinkedIn coverage block, "The 1% rule alignment" (its "below C-grade" line still reads true).
- The Dimension 9 heading's pre-existing spaced em dash ("gate [em dash] fabricated/pattern names fail the list"): not a rewritten line, meaning still correct.
- **Script Policy** ("No bundled scorecard script is currently required"): left as is. `outbound/scripts/list_quality_scorecard.mjs` exists but does not implement the new rules (see Scripts below), so the skill should not point operators at it yet.

---

## Scripts (CHECK ONLY, not edited)

| Script | Verdict |
|---|---|
| `outbound/scripts/list_quality_scorecard.mjs` | **Contradicts the new skill rules. Open item.** (1) d5 is computed on every list from `evidence_url` + `signal` + `source_confidence` (lines 84-86) and weighted 2x, with a fixed total weight of 12 (lines 133-146): no Dimension 5 N/A and no renormalization to 10, so an offer-led list with no signal is marked down. (2) No Step 1 systemic checks and no Step 2 row-level cleanup: it grades `leads.verified.csv` as-is, never writes `leads.verified.pre-scorecard.csv`, never quarantines to `leads.review.csv` with `review_reason`. (3) No domain-relevance check in d8. (4) The F action string at line 148 still reads "Don't send. Rebuild the list." (5) Name-quality note hard-codes "(A-Leads named)" (line 143, a brand; pre-existing). Its d1 "100% valid by construction" matches the skill. |
| `outbound/scripts/lead_score.py` | **Consistent.** Line 681 already says every eligible score P1 to P5 stays in the outreach queue; no tier hold. It has no capacity input, so it cannot write the new coverage line; the skill now says the session appends it after the script runs. |
| `outbound/scripts/leads_split_verified.mjs` | **Consistent on yield** (no 80% gate; every `valid` row goes to `leads.verified.csv`; whole rows copied, so `source_arm` and the per-contact variable columns survive). Two gaps, neither a contradiction of this spec: it writes no `review_reason` column (the scorecard's Step 2 appends `review_reason = scorecard_<check>` to `leads.review.csv`, so the column needs to exist or be added), and it sends `catch_all` to `leads.review.csv` rather than `leads.catchall-holdback.csv` (pre-existing drift from the Catch-All Timing rule, out of scope). |

---

## Checks (actual output after the last edit)

Line endings, BOM, spaced dashes, YAML (`listb-check.sh`, which runs `wc -l`, `grep -c $'\r$'`, `head -c3 | od`, `grep -c ' [em dash] | [en dash] '`, and the section-9 python yaml assert):

```
.claude/skills/email-waterfall/SKILL.md | lines=347 crlf=347 first3=2d2d2d dashes=5 yaml=ok
.claude/skills/lead-scoring/SKILL.md | lines=309 crlf=309 first3=2d2d2d dashes=0 yaml=ok
.claude/skills/lead-source-strategy/SKILL.md | lines=408 crlf=408 first3=2d2d2d dashes=9 yaml=ok
.claude/skills/list-quality-scorecard/SKILL.md | lines=264 crlf=264 first3=2d2d2d dashes=13 yaml=ok
```

- CRLF: every line CRLF in all four files. No BOM (first bytes `2d2d2d` = `---`).
- Spaced dashes, baseline then after: email-waterfall 8 -> 5; lead-scoring 0 -> 0; lead-source-strategy 9 -> 9; list-quality-scorecard 14 -> 13. Zero spaced dashes on any added or changed line (counted on the `>` side of each diff against the archive: 0, 0, 0, 0). The drops are old dashes on lines this pass rewrote.
- YAML: all four frontmatters parse; `name` intact; three descriptions edited, none contains an unquoted ": ".
- Edits made with the Edit tool only. `git status` shows only these four skill files modified by this group.

## Grep results (section 10 list, case-insensitive, all four files)

| Pattern | Hits | Ruling |
|---|---|---|
| `size the list to the offers`, `size the validation list`, `size the test list`, `8,000 to 12,000`, `at least arm 1`, `primary plus at least one`, `never retires it`, `not to scale`, `trim the wave`, `capacity trim`, `Signal collection is a MUST`, `Collection Completeness`, `varying only the first name`, `both required Email 1 variant columns`, `proposes times only when`, `Wait 21 days`, `21-day window`, `21 days`, `21-day`, `Tue to Thu`, `Tue-to-Thu`, `Tuesday or Thursday`, `winning slice`, `raise the ceiling to cover full collection`, `shared pool`, `pool-allocation`, `top 10`, `email_1_b` | none | clean |
| `80%` | email-waterfall:295 | correct: the supersession note quoting the retired stop, so nobody re-adds it |

Extra greps: `capacity` (lead-scoring 240, 242, 244, 247; lead-source-strategy 97) are the new definitions, the supersedes quote, and the rewritten delivery-capacity line; `confirmed slice` (email-waterfall 3, 36, 114, 138) all state the new first-wave rule or quote the old one inside a supersedes clause; `across the entire TAM` (email-waterfall 36) sits inside the supersedes clause; `stay queued` (email-waterfall 101) inside the supersedes clause; `lazy path` / `weak thinking` (lead-source-strategy 116, 21) now scoped to titles-plus-headcount pulls with no offer relevance; `rebuild the list` (scorecard 10) inside the supersedes clause; `C-grade` (scorecard 263) the unchanged 1% rule note; `industry filters` (lead-source-strategy 176) the Aaron quote in the new rule.

**Pinned names used, checked against section 6:** `run_state.capacity_request`, `daily_sends_needed`, `allocated_daily_sends` (6b); `offer.qualification`; `offer.title_stack`; `service_offered`, `own_best_client`, `_source` URLs (6f, spelled `service_offered_source` and `own_best_client_source`, matching A-Sales's `personalization-subagent-pattern` at 56ff4a2c); "Offer-Validation Wave" kept. No `run_state` field renamed.

## `_vendor-library` files holding the same rule (not edited)

- `_vendor-library/scripts/bettercontact/bettercontact_enrich.mjs` lines 13-14 (header comment): "run it on the campaign slice that is going live, never across the whole TAM up front." Same old reveal-scope wording as email-waterfall's old line 258. Parked pack, inert; left alone per s5.
- No 80% yield stop, P1-first hold, or "Rebuild the list" found anywhere under `_vendor-library/`.

## Does not map

None. (A possible tension between `campaign-strategy`'s growth-first send ordering and lead-scoring's score-order send order was checked and is not a conflict: growth ordering only decides who goes first inside a runway stretched by short capacity, and the two coexist. It is logged as follow-up 10 below, not escalated.)

## Cross-file follow-ups (files this group does not own)

1. **copy group** (`/personalization-subagent-pattern`, `/campaign-copywriting`): email-waterfall now preserves `service_offered`, `service_offered_source`, `own_best_client`, `own_best_client_source` through every export. Use exactly these spellings; a divergence breaks the preserve list silently.
2. **strategy group** (`/campaign-strategy`) and **testing group** (`/experiment-design`): read the first wave offer by source using the new `source_arm` column (defined in lead-source-strategy, preserved by email-waterfall), not `source`, which still names the vendor and is read by scorecard Dimension 5 and the waterfall exports. Lead-scoring expects `run_state.capacity_request.allocated_daily_sends` and computes days to cover as contacts x steps / allocated sends in Monday-to-Friday days, matching the strategy group's block (checked: campaign-strategy line ~185-192 already uses the same formula and fleet wording).
3. **list-a** (`/tam-build`, `/icp-onboarding`): (a) email-waterfall reads `offer.title_stack` for the scrape-all title filter; tam-build's contact discovery should use the same field. (b) lead-source-strategy line 176 says `/tam-build` builds the keyword stack for the TAM pull (Claude Code, never a workbench AI column) with `industries_out` as named exclusions; tam-build should state that as its own rule. (c) lead-source-strategy line 367 now states the Seeds rule (5 to 10 offer-fit companies, exemplars for a brand-new offer, broad ICP filter as the last rung); tam-build's two-motion text (its line ~96 calls the expansion motion "a deliberate FIRST-CLASS motion") must match. (d) tam-build line ~110 contains "Never a blanket 80%" (a fit-rate note on widened rungs, not the yield stop); flagging only so list-a rules on it.
4. **cleanup group** (`campaign-approval-brief`, `outbound/scripts/campaign_approval_brief.ps1` is outside every group): the new optional `## Parallel Source Arms` section and the Backup `**Live arm:**` label are not parsed (the script reads Backup labels at lines 392-396 and 456-458), so a multi-source wave shows only its primary and backup in the deck. `**When to switch:**` was kept, so nothing breaks.
5. **cleanup group** (`outbound/reference/verified-list-gate.md`, CHECK ONLY for them): line 21 gates on grade B or better and line 29 says "Grade below B -> fix the source/list (do not send a thin list)". The threshold is unchanged, but it should read "grade B or better on the scorecard's cleaned remainder", and "do not send a thin list" echoes the deleted 80% yield stop.
6. **Scorecard script** `outbound/scripts/list_quality_scorecard.mjs` (no owner in s7): needs Dimension 5 N/A with renormalization to 10, Step 1 systemic checks, Step 2 row-level cleanup (write `leads.verified.pre-scorecard.csv`, quarantine to `leads.review.csv` with `review_reason`), the domain-relevance check inside d8, and the new F action text. Until then the skill's Script Policy correctly does not point at it.
7. **`outbound/scripts/leads_split_verified.mjs`** (no owner): add a `review_reason` column so the scorecard's quarantine rows and the waterfall's `no_email` / `invalid` rows share one schema; separately, route `catch_all` to `leads.catchall-holdback.csv` per Catch-All Timing (pre-existing drift).
8. **orchestration group** (`/cold-email-kickoff`, `/continue-client`, `/cold-email-flow-audit`): anywhere they paraphrase lead-scoring's old "P1 first, then P2 to P5 as capacity opens" or email-waterfall's 80% stop, point them at the new wording. A grep of `.claude/skills`, `outbound/reference`, `outbound/scripts` and `README.md` for `as capacity opens|as capacity becomes available|tiers stay queued|P1 first|80% of the original|not needed, offer test|offer-test exception|Can we reference the signal` found no other hits outside these four files at the time of writing.
9. **Spec open item 1 (run budget for a whole-TAM reveal)** is now visible in two places: email-waterfall's budget stop states the whole-TAM cost against the budget, and lead-scoring's coverage line names the budget as the binding limit. Raising `spend_ceiling_usd` stays an operator spend call.
10. **strategy group** (`/campaign-strategy`, its "Order the send by growth when the TAM outruns capacity" paragraph): lead-scoring now says P1 to P5 is the send order inside the wave. Growth-first ordering can coexist as a tie-break on who goes first within the stretched runway, but the cleanest single send order is to express headcount growth through the score's `timing` component (or as a within-tier tie-break). Low priority; no operator decision needed.
