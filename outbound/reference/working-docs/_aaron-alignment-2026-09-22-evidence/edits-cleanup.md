# Edits: cleanup group (FNNL Aaron process alignment port, 2026-09-23)

**What this is.** The change log for the cleanup group: my owned files, the check-only files, and the section 10 sweep of files no group owns. Every change is labelled `(Aaron process alignment, operator directive 2026-09-22)` in the file. Nothing committed, no sub-agents, no other group's file touched.

## READ FIRST: baseline.tsv is wrong about line endings for most of my files

`baseline.tsv` says every target file is CRLF (`crlf_lines` = `lines`). That is false for 8 of my 10 edited files. The repo mixes LF and CRLF on purpose (`.gitattributes`: `* -text`, "Skills and scripts here are a mix of LF and CRLF"). Byte counts, pre-change archive vs HEAD:

| File | HEAD / archive | Now |
|---|---|---|
| api-cost-governance/SKILL.md | LF (0 CR) | LF (0 CR) |
| signal-strategy-playbook.md | LF | LF |
| lead-list-tech-stack-research/SKILL.md | LF | LF |
| auto-research-public/SKILL.md | LF | LF |
| list-building-play-library.md | LF | LF |
| campaign-approval-brief/SKILL.md | LF | LF |
| campaign-approval-brief-template.md (both copies) | LF | LF |
| conversational-copy-examples.md | CRLF 20/20 | CRLF 20/20 |
| verified-list-gate.md | CRLF 46/46 | CRLF 46/46 |

I kept each file's own ending and did **not** run the section 9 `perl` conversion, which would have turned LF files into whole-file diffs. **Coordinator: other agents following section 9 literally may have flipped LF files to CRLF.** Check each group's files against its own archive copy, not against `baseline.tsv`.

**Coordinator correction received mid-task** ("each file keeps the exact line endings its archive copy has"; never run the perl fix). I am compliant: **the perl fix was never run on any file.** Byte check with the coordinator's method, `(b.count(b'\r\n'), b.count(b'\n'))`, archive vs now: api-cost-governance (0,160)/(0,160); signal-strategy-playbook (0,771)/(0,771); lead-list-tech-stack-research (0,2427)/(0,2427); auto-research-public (0,239)/(0,240); conversational-copy-examples (20,20)/(20,20); list-building-play-library (0,241)/(0,241); campaign-approval-brief (0,274)/(0,275); campaign-approval-brief-template (0,271)/(0,273); docs mirror (0,271)/(0,273); verified-list-gate (46,46)/(46,46); coldoutbound-gotchas (0,237)/(0,237); cold-email-starter-kit (0,86)/(0,86); README (0,91)/(0,91). Every file keeps its archive's pattern.

---

## Section 1-2 evidence (A-Sales diffs, 56ff4a2c vs archive)

Each of the three A-Sales files changed exactly one line:
- `api-cost-governance:168`: collection "complete by default ... raise the ceiling to cover full collection" became conditional collection. Signals are trimmed first, companies, fit and contacts are kept, and raising the ceiling stays the operator's call (Collection Scope).
- `signal-strategy-playbook:680`: the "Collection Completeness HARD RULE ... signal collection is a MUST" in the Collection-vs-launch paragraph became Collection Scope (conditional).
- `lead-list-tech-stack-research:22`: the work-email row "(Layer 2, winning slice only)" became "campaign-confirmed contacts only; in the first wave that is the whole eligible TAM". A-Sales left its Layer 1/Layer 2 section (lines 69-90) and line 1895 unchanged.

A-Sales changed none of my other files at 56ff4a2c. Those edits are FNNL-side sweeps (section 2 step 6).

---

## Per file

### 1. `.claude/skills/api-cost-governance/SKILL.md` (LF)
- **Line 149** (FNNL's old wording at the same line): "TAM signal collection is complete by default ... Collection Completeness HARD RULE ... Signal collection is a MUST ... and nothing else gates collection completeness ... raise the ceiling to cover full collection ... trim-by-rank only on the operator's explicit choice. Never silently drop obtainable signals". It now reads as follows. Collection is conditional. `/tam-build` always collects firmographics, fit, offer-relevance fields, contacts and the free Layer-1 fields. A paid why-now or intent signal is collected only when the offer can't find its buyers from firmographics or a live test needs it ("the Collection Scope rule in `/data-point-discovery`", 6h). Over the ceiling, the recommendation is to trim the conditional signals first and keep companies, fit and contacts, and raising the ceiling stays the operator's call. Companies and contacts are never silently dropped, and the ceiling is never auto-raised. The supersession note names the 2026-06-29 MUST and the "raise the ceiling to cover full collection" default. Rule: section 3 reversal 5, 6c, 6h.
- Kept FNNL's own cost vocabulary ("discovery-source and per-record credits; ... Claude Code sub-agents with WebFetch and costs nothing here"). A-Sales's "A-Leads and gap-fill credits, plus Clay Actions" was not imported. Deleted "and nothing else gates collection completeness", because it carried the retired rule name.
- Swept the rest of the file (completeness, obtainable, winning, slice, reveal): no other statement of the old rule.

### 2. `outbound/reference/signal-strategy-playbook.md` (LF)
- **Line 767** (the same paragraph as FNNL's old wording): "collects every obtainable signal and data point up front ... (the Collection Completeness HARD RULE ...) [em dash] signal collection is a MUST, never optional or tiered [em dash] so the full slice menu always exists". It now says the TAM build maps the whole qualified TAM with firmographics, fit, offer-relevance fields, contacts and the free Layer-1 fields. A paid why-now or intent signal is collected only when the offer needs it or a live test does (the Collection Scope rule in `/data-point-discovery`, with a supersession note). The catalog still lists every obtainable signal, so a slice can be added later. Removed one spaced em dash (47 to 46 lines). Rule: reversal 5, 6h.
- **Left unchanged: line 765.** It reads "Launch as many of these signal campaigns as your warmed sending capacity supports ... thin capacity launches the top-priority ones now and queues the rest". This is about the signal-slice fan-out, the bounded test allocation after an offer is proven, which section 4 keeps. It never cuts offers or TAM rows, and A-Sales left the same line.

### 3. `.claude/skills/lead-list-tech-stack-research/SKILL.md` (LF)
FNNL has no "Work email (Layer 2, winning slice only)" row. FNNL's statements of the rule are "the live campaign slice" / "the slice a campaign sends to" (lines 23, 72, 83, 89, 1869). The test I applied: read literally, does the sentence now forbid a whole-TAM first-wave reveal?
- **Line 23** (the waterfall row's weak move): "Running it across the whole TAM instead of the live campaign slice" now reads "Running it across the whole TAM before scoring and campaign selection, instead of on the campaign-confirmed contacts (in the first wave those are the whole scored, eligible TAM; ...)". Rule: section 3 Lists (the whole scored eligible TAM is the first wave's confirmed slice).
- **Line 89** (the Layer 2 rule): "spend Layer 2 only on the slice a campaign sends to. Never run per-contact reveal / verification across the whole TAM up front [em dash] ..." now says Layer 2 is spent only on the contacts a campaign has confirmed. In the first wave that is the whole scored, eligible TAM, revealed and verified in P1 to P5 order, and the standing $100 budget still stops and asks. The "never ... up front" clause now reads "before scoring and campaign selection". Removed one spaced em dash occurrence (the line keeps a second one, so the rg line count stays 52).
- **Line 85** (the Contact DISCOVERY bullet sat under "Layer 2, defer to the live campaign slice"): added that discovery itself, with no email reveal, runs up front across the whole qualified TAM in `/tam-build` Layer 1d, because `full_enriched` means mapped, fit-scored and contacts discovered, with signal columns optional (6c). This was stale before this pass too (tam-build Layer 1d already discovered contacts TAM-wide, and A-Sales has the same staleness). The pinned 6c made it a direct contradiction.
- **Left unchanged:** line 72 and the line 83 header ("the slice a campaign actually sends to" / "defer to the live campaign slice"), which the line 89 definition now governs, and line 1869 (a catalog vendor's "Where it can fail": "keep it on the live campaign slice (Layer 2), never the whole TAM", consistent under the same definition). All tool names and tool choices are untouched.

### 4. `.claude/skills/auto-research-public/SKILL.md` (LF)
- **Line 154** (the old wording was on the same line): "fills each row's `email_1_a` / `email_1_b` ... varying only the first name ... Email 1 step then carries just the `email_1_a` variable". The line now fills each declared Email 1 column. Email 1 runs three variants by default (pinned 6g text). Each body varies only the first name and at most two per-contact variable values inside the offer sentence (6f: `sells_to_vertical`, `service_offered`, `own_best_client`, with a `_source` URL and the fallback body). They are derived by Claude Code sub-agents, never by an AI column in the list workbench (section 5). The platform step carries one variation per declared Email 1 column on an even split, and stops rather than dropping Variant C (6g). Both halves of the old sentence are fixed, so the text no longer says three columns exist while only one gets wired. Rules: 6f, 6g.
- **Line 146** (a FNNL-only restatement of Hard Rule 19, "the one exception being the labeled outcome-conditional arm"): added the labelled relevance-question opener arm (any awareness level, literally relevant, answerable honestly, implies no relationship). Rule: section 3 Copy.
- **Lines 204 and 206** (the Final Handoff "Review before launch" list, the only pre-Start checklist on this standalone path): "Schedule is correct" became "(Monday to Friday by default)", and a new bullet says Gate D reply readiness must pass (both files, `offer.qualification` where needed, and a named speed-to-lead owner with the 5-minute target). This is written fresh as a new requirement the spec adds (6d), so this path can't reach Start around Gate D. Rules: Send Monday to Friday, 6d.

### 5. `outbound/reference/conversational-copy-examples.md` (CRLF, kept)
- **Line 12:** "varying only the first name and any variable that changes what is delivered" became "varying only the first name and at most two per-contact variable values inside the offer sentence, already in the data or cheaply derived (the three 6f names; supersedes first-name-only variation)". Rule: 6f.
- **Line 10** (a FNNL-only statement of the old sequence rule): "ONE thread, 2 to 3 steps, no second new thread, no Email 4" became "ONE thread, two emails by default (a third only in a genuinely small market or as a tested arm), no Email 4, and no second new thread except a final follow-up run as the logged new-thread arm". Rules: 6j, section 3 Copy (the new-thread final follow-up arm).
- Line 11 (the default CTA) is unchanged: the whitelist grew, and the default did not change.

### 6. `outbound/reference/list-building-play-library.md` (LF)
- **Line 139** (the Offer-Validation Wave description; the old wording was "splits one broad list evenly into one cell per offer"). It is now the whole qualified TAM at full volume with the offer test inside it. The offer count uses the pinned 6a string verbatim with the Apr 6 and May 4 cites. Every first-wave segment is split evenly into one cell per offer, launched together, so the read is an offer x segment matrix. The primary gets no head start, and only arms beyond the count queue. The supersession note is for sizing a validation list to the chosen offers. The name "Offer-Validation Wave" is kept. Rules: reversal 2, 6a.
- **Line 147** (the four-lever order): the order is kept, and it now "sets what is tested first, never how much is sent". Aaron validates the offer by sending volume (Sep 21, about 96,000 sends in one week), and what waits for a proven offer is the signal-slice fan-out, never the rest of the TAM. This is ported from how A-Sales campaign-strategy:90/118 reframes the same order. Rule: reversal 2.
- **Line 155** (the per-group ruling; the old wording was "in parallel when send capacity allows and the priority group first when it does not"). The formula now runs on each group's own qualified contacts, and every group launches. When capacity can't carry every group at the one-week pace, the runway stretches and the priority group goes first in send order. Rules: reversal 3, the `offer.segments` port.
- **Line 164** (the old wording was "runs in parallel with the others when send capacity allows"): the group now launches alongside the others, and thin capacity stretches the runway and sets send order. Rule: reversal 3.
- **Line 170** (the live order; the old wording was "then offer, then lead magnet, then data points, then TAM, then scoring, then campaign slices"). It now lists the front-end offer set (a lead magnet is one of three buckets, not a separate step), then data points, then the 5 to 10 offer-fit seeds, then the lookalike TAM, then scoring, then campaign and test design with the capacity request, then copy, then the reply machine before launch. Rules: the phase order, the Front-End Offer Builder reframe, seeds.
- **Line 237** (Related): adds "(applied per offer cell)" to the ≥500-company floor, and "(the whole qualified TAM at full volume, the offers as equal cells inside it)" to the Offer-Validation Wave.
- **Left unchanged:** line 149 ("Validate the offers broadly first ... Once one shows life, fan out" means the signal fan-out after a winner, which is consistent); line 228 checklist "**One offer.** The group varies the copy variable, not the offer" (a grouping rule: a group doesn't get its own offer; kept on advice); line 230 (wave shape, kept).

### 7. `.claude/skills/campaign-approval-brief/SKILL.md` (LF)
- **Line 57** (TAM-First Gate): `full_enriched` now carries the 6c short form "mapped, fit-scored and contacts discovered; signal columns optional", plus "a missing signal column is never a reason to stop". Rule: 6c.
- **Line 89** (the lead-magnets.md row): "first flight and queue" became "the first-wave offers, launched together as equal cells across the whole qualified list, and any arms beyond the first-wave offer count, which queue". Rule: reversal 2.
- **Line 123** (copy hard-stops; FNNL's old wording was "broken single-thread 2-to-3-step structure (a second new thread or a 4th email)"). It now reads broken sequence structure: two emails by default, a third only in a small market or as a tested arm; a 4th email, or a second new thread other than the logged final-follow-up arm. Rules: 6j, the Copy new-thread arm.
- **Line 176** (Slide 4): "the guide-first / signal logic" became "the offer-first / list logic". "Guide-first" framed the deck around an asset offer, and nothing ranks asset offers first by default (the Front-End Offer Builder decision).
- **Line 238** (new bullet in the "What We Need From You" include list): the reply-readiness items only the client can supply, because the reply machine is built before Start (Gate D). When the client's own team takes the calls, that is who calls an interested reply (the speed-to-lead owner and the 5-minute target) and the booking calendar the two times come from. For a trial, service or custom-work offer the client delivers, it is the `offer.qualification` questions. Rules: 6d, 6l, qualification after the yes. **Deviation from advice, stated:** the advisor pointed to A-Sales `edits-orchestration.md:143` ("not changed"). That note was about adding a new "how replies are handled" deck section. This change is narrower: it only lets Slide 5 ask for a client-held Gate D input when one exists.
- Send days: **absent** in the SKILL (no Tue to Thu statement), so no sentence was imported.

### 8. `outbound/reference/campaign-approval-brief-template.md` **and its byte-identical mirror** `.claude/skills/campaign-approval-brief/docs/campaign-approval-brief-template.md` (LF, both)
The file's own header requires the two copies to stay identical ("or the skill and the DOCX converter will disagree"). The mirror is inside my skill folder and no other group owns it. It is not in `archive-map.tsv`, so before editing I archived it byte-for-byte as `outbound/_archive/aaron-process-alignment-2026-09-23/campaign-approval-brief-docs-template--pre-change.md`. `cmp` confirmed that archive is identical to both the mirror and the existing reference archive. I applied identical edits to both copies. Final `cmp`: MIRRORS_IDENTICAL.
- **Line 63** (the section-order spec for Step 1; old wording: "2 to 3 emails over ~two weeks ... two versions of the first email"). It now says two emails, three days apart, Monday to Friday, a third only for a small market or as a tested arm, and three versions of the first email. Rules: 6j, 6g, Monday to Friday.
- **Line 69** (the Section 6 spec): adds the client-held reply-readiness items (the caller and calendar when the client's team takes calls, and the qualifying questions for a costly front end the client delivers). Rule: 6d.
- **Line 141** (the skeleton's "What we'll offer them"; old wording: "list the first flight and the queue"). It now says plainly that every company that fits is loaded in the first send, split evenly between the offers on every list, and that once one offer clearly wins, everyone not yet emailed gets it. The offers in the first send and any queued behind them are listed exactly as the slate showed them. Rules: reversals 2 and 4.
- **Line 176** (Expected volume; old wording: "1–2 verified decision-makers each"): "every matching decision-maker at each, about <n> verified contacts". Rule: map the whole TAM (every ICP decision-maker on every company).
- **Line 189** (Step 1 client prose; the same old wording as line 63): two short emails, three days apart and sent Monday to Friday, a third only for a small market or as a test, three versions of the first email.
- **Lines 191 and 195-199** (Step 2, what gets personalized; old wording: the company name, a one-line descriptor, a per-row signal, "one specific public detail ... Our AI reads the site", and the first name). It is now one shared message with at most two facts about each company inside the offer (what they sell, who they sell to, their own best client, each with the page saved as the source). The first name is optional, and the list's reason appears only when it is true of every company on the list. Rules: 6f, plus HR34/HR38 consistency. "Our AI" is gone.
- **Line 201** (Step 3; old wording: "so the opener reads like a specialist who looked"): now says what the research fills in from the company's own site so the offer names the right thing, and that a company without a confirmed fact gets the version without it. Rules: 6f, offer-first opener.
- **Lines 224-225** (new, Section 6 skeleton): conditional asks 4 (who calls back a yes, about 5 minutes, and the booking calendar) and 5 (who gets the free unit on a trial, service or custom-work offer the client delivers). Rules: 6d, 6l.
- **Line 235** (What Happens Next, step 2): every contact is checked on its own, failing ones are removed, then the list as a whole is graded. Rule: row-level list QA, then grade.
- **Lines 237-238** (steps 4-5): reply handling is set up before anything sends (the reply templates, a call script, and the page after booking). Every company goes into the first send on weekdays, results are read daily in the first week, and the winning offer then goes to everyone not yet emailed. Rules: 6d, the phase order, Monday to Friday, reversal 4, read daily.
- **Line 240** ("Things we won't skip"): adds row-level checking before the B grade and "reply handling ready before the first send". Line 70 of the template defines this line as "the per-campaign stop gates", and Gate D is one of them.
- Client prose rules held: plain words, no "TAM", no tool names, no `{{`, no spaced dashes (0 before, 0 after).

### 9. `outbound/reference/verified-list-gate.md` (check-only; CRLF, kept) **EDITED on a real hit**
- **Line 36:** "`interested-reply` and `pre-call` nurture in `/lifecycle-copy` run after a reply already exists" was no longer true, because Gate D requires both files before Start. It now says they are written before Start (Gate D) but only ever sent after a reply or a booking, so they assert only the parent gate. Removed one spaced em dash (9 to 8 lines). This is the same fix A-Sales's replies group made in lifecycle-copy (A-Sales edits-replies row 69).
- The rest of the file is unchanged. "LIST GRADE ... B or better" and "Grade below B → fix the source/list" are consistent with row-level-then-grade (list-b kept the threshold).

### 10. Check-only, no real hit, **unchanged**
- `.claude/skills/coldoutbound-gotchas/SKILL.md`: the only "capacity" hits are mailbox-provider purchase gotchas (lines 67-69, 183-191). No old-rule statement.
- `.claude/skills/cold-email-starter-kit/SKILL.md`: the orientation-only Flow Map (lines 46-55, "kickoff is the authority") omits the seeds, the capacity request and the reply machine, but it doesn't contradict them. Line 71 "list below B grade" is consistent. Optional refresh: see follow-ups.
- `README.md`: line 38 "reveals contact details only for leads worth paying for" is consistent (the scored, eligible TAM). No hit.

---

## Mechanical checks (actual output)

**Line endings, BOM, lines** (byte count via node, compared with each file's own pre-change archive):
```
api-cost-governance/SKILL.md            lines 160 -> 160 | crlf 0 -> 0 OK | bom false
signal-strategy-playbook.md             lines 771 -> 771 | crlf 0 -> 0 OK | bom false
lead-list-tech-stack-research/SKILL.md  lines 2427 -> 2427 | crlf 0 -> 0 OK | bom false
auto-research-public/SKILL.md           lines 239 -> 240 | crlf 0 -> 0 OK | bom false
conversational-copy-examples.md         lines 20 -> 20 | crlf 20 -> 20 OK | bom false
list-building-play-library.md           lines 241 -> 241 | crlf 0 -> 0 OK | bom false
campaign-approval-brief/SKILL.md        lines 274 -> 275 | crlf 0 -> 0 OK | bom false
campaign-approval-brief-template.md     lines 271 -> 273 | crlf 0 -> 0 OK | bom false
  (docs/ mirror)                        lines 271 -> 273 | crlf 0 -> 0 OK | bom false
verified-list-gate.md                   lines 46 -> 46 | crlf 46 -> 46 OK | bom false
coldoutbound-gotchas, cold-email-starter-kit, README.md: unchanged (byte-identical to archive)
```
**Spaced-dash lines** (`rg -c " [em dash] | [en dash] "`, pre -> now, baseline): api-cost 4->4 (4); signal-strategy-playbook 47->46 (47); lead-list 52->52 (52); auto-research 2->2 (2); conversational 0->0; list-building 0->0; brief SKILL 0->0; template 0->0; docs mirror 0->0; verified-list-gate 9->8 (9). None rose.

**YAML** (`python ... yaml.safe_load ... print('ok')`): api-cost-governance ok; lead-list-tech-stack-research ok; auto-research-public ok; campaign-approval-brief ok.

**Pinned names used, checked verbatim:** "the Collection Scope rule in `/data-point-discovery`" (6h); the 6a formula sentence (list-building:139); the 6c short form (brief SKILL:57, lead-list:85); the 6g sentence with the Sep 21 and Mar 9 cites (auto-research:154); the 6f variable names and `_source`; Gate D, `## Call Script` / Confirmation Page, `offer.qualification`, speed-to-lead owner (6d).

---

**Final re-run after the last edit** (same literal pattern over `.claude/skills` and `outbound/reference`, excluding `_archive`, `working-docs` and `ask-*`): 103 hits across all groups. 4 are in my files (listed below) and 1 is in an unowned file (the G2 `80%`). The hit set is unchanged from the first sweep. Late fix before the re-run: `auto-research-public:206` no longer cites "/cold-email-kickoff Step 6". It now cites "Gate D, reply readiness, in /cold-email-kickoff", so the reference can't dangle if orchestration renumbers kickoff steps. Byte check after that fix: (0 CRLF, 240 LF), still LF.

## Section 10 grep: my files (remaining hits, each correct in context)
- `api-cost-governance:149`: "Signal collection is a MUST" and "raise the ceiling to cover full collection" appear only inside the supersession note.
- `signal-strategy-playbook:767`: "signal collection is a MUST" appears only inside the supersession note.
- `auto-research-public:154`: `email_1_b` sits beside `email_1_c` (the 6g set).
- `conversational-copy-examples:12`: "varying only the first name" is followed by "and at most two per-contact variable values" (6f).
- No hits in my files for: 21-day/21 days, Tue to Thu, winning slice, 80%, shared pool, pool-allocation, top 10, not to scale, capacity trim, trim the wave.

## Section 10 grep: every hit in files NO group owns (whole `.claude/skills` + `outbound/reference`, excluding `_archive`, `working-docs`, `ask-*`)
The literal list returned **one** unowned hit:
- `outbound/reference/email-infra-comparison.md:157` "80% trust score": **correct in context**. It's a G2 score, allowlisted in section 8.

Because the literal list misses reworded carriers, I also ran a semantic sweep of the 22 unowned skills and 10 unowned reference docs. Hits and verdicts:
1. **`.claude/skills/cold-email-campaign-sequence-docx-presentation/SKILL.md:34`**, "broken two-thread 4-step structure": **needs a change.** It is the retired 4-step two-thread shape. Replace it with the line I used in campaign-approval-brief:123: "broken sequence structure (two emails by default, a third only in a genuinely small market or as a tested arm; a 4th email, or a second new thread other than a final follow-up run as the logged new-thread arm)". Its lines 87/173 render "every variant from YAML", so Variant C passes if the copy group's `campaign_docx_presentation.ps1` check holds.
2. **`outbound/reference/social-proof-bank-client-fill-template.md:30, :109, :136-137`**, "Cold emails that name a real client and a real result get replies" (said 3 times, client-facing): **needs a change.** The spec says the client proof form no longer claims proof drives replies. Use the same rewrite the offer group applies to `proof-asset-request.md` (A-Sales 56ff4a2c lines 58-61 and 125-130: "Your campaign is going out on the offer itself. A real number lets us add one short proof line and test whether it helps."). **A-Sales has the same gap:** its copy of this file was not changed at 56ff4a2c.
3. **`.claude/skills/client-intake-form/SKILL.md:60, :134-135, :285`**, a single `buying_job_title` (REQUIRED); and **`:62, :145, :288`** `industries_in`: **needs a change.** Onboarding asks for buying function and seniority, not one job title; titles come from `offer.title_stack`; the intake ICP is a starting point, not a ceiling; `industries_in` is plain language that becomes a keyword stack (A-Sales edits-list-a follow-up 6). Map to whatever field names list-a gives `/icp-onboarding`. Never rename `run_state` fields.
4. **`.claude/skills/client-onboarding-call-summarizer/SKILL.md:55, :91`**, "buying job titles": **needs a change**, the same as item 3 (capture function and seniority). Line 98 "capacity remarks (scale-review context, not a filter)" is **correct in context**; optionally add that it also informs `offer.qualification`.
5. `.claude/skills/deliverability-incident-response/SKILL.md:188` "Create two versions ... Send 50 leads each ... after 7 days": **correct in context.** It is a spam-filter content diagnostic (deliverability, exempt), not an offer or arm read. Optional clarifier so nobody reads it as an arm-read window.
6. `.claude/skills/email-deliverability-audit/SKILL.md:64` "1% reply rate after 200+ sends": **correct in context** (domain-health heuristic).
7. `outbound/reference/social-proof-bank.md:14` "the whole slice stalls at copy time": **correct in context.** It describes the failure the bank prevents and is not a holding rule.
8. `.claude/skills/client-intake-form/SKILL.md:177` "optional labels for the post-test scale review": **correct in context** (scale review still exists as a results report).
9. `outbound/scripts/campaign_approval_brief.ps1:405-588`: checked because it renders my files. It parses variants generically by label, so Variant C renders. `approval-brief-pptx/lib.mjs` has no variant-count logic. **No change.**

## `_vendor-library` files holding the same rules (NOT edited, parked packs)
- `_vendor-library/skills/a-leads/aleads-api/SKILL.md:126`: "Layer 2 (per-contact, live campaign slice only)". This is the same rule as lead-list:89, where the first-wave slice is the whole eligible TAM.
- `_vendor-library/skills/smartlead/smartlead-campaign-upload-public/SKILL.md:52` and `_vendor-library/skills/emailbison/emailbison-campaign-upload-public/SKILL.md:31`: "broken two-thread 4-step structure". Same files: two Email 1 variant columns (`email_1_a`, `email_1_b`) at smartlead :113, :141, :167 and emailbison :86, :116, :148, :174.
- `_vendor-library/skills/{smartlead,emailbison}/*-spintax/SKILL.md`: one `email_1_b` hit each (pre-written column path).

## Does not map
None. Every rule I met was settled by sections 3 to 6.

## Cross-file follow-ups (for the coordinator and owners)
1. **Coordinator, line endings:** see the top section. `baseline.tsv`'s `crlf_lines` is wrong for LF files. Any agent that ran the section 9 `perl` step on an LF file has produced a whole-file diff.
2. **replies group, `lifecycle-copy/SKILL.md`: RESOLVED.** It read "post-reply / post-booking (a reply or booking already exists)" at line 65 early in my run. When I re-checked at the end, line 69 read "written before Start but only ever sent after a reply or a booking", which now matches my verified-list-gate:36 fix. No action.
3. **copy group:** `cold-email-campaign-sequence-docx-presentation:34` (unowned item 1) states the copy hard-stop sequence shape. If the copy group writes a canonical sequence-structure hard-stop line, reuse it there and in campaign-approval-brief:123.
4. **offer group:** `social-proof-bank-client-fill-template.md` (unowned item 2) is the client proof form beside `/social-proof-bank`. It is the natural twin of the `proof-asset-request.md` rewrite.
5. **list-a group:** `client-intake-form` and `client-onboarding-call-summarizer` (unowned items 3 and 4) feed `/icp-onboarding`, and their fields should match list-a's new `buying_function` / `seniority` names.
6. **Optional, cold-email-starter-kit Flow Map** (mine, check-only, no contradiction): a one-line refresh could add the seeds, the capacity request and the reply machine (Gate D) before Start. Not done, because the map defers to kickoff and "edit only on a real hit".
