# List Production Standard

**What this is.** The one rulebook for turning a targeting decision into a campaign-ready lead list. It sets the order of work and the state every account and person is in. It says when each waterfall (the ordered list of tools tried one after another for one data field) continues, falls back, moves to another person, or stops, what gets recorded, and the QA a list must pass before copy. The skills that run the build (`/tam-build`, `/lead-scoring`, `/email-waterfall`, `/list-quality-scorecard`) follow it, and the scripts in section 2 implement it. Added 2026-09-24.

**The success metric is not "how many leads did we enrich."** It is how many correct, relevant, verified, non-suppressed, campaign-ready contacts survived the full QA. A perfectly verified email for the wrong person is still a bad lead.

**What this file does not restate** (it points to the owner instead):
- Which tools are in the stack, and the rule for anything outside them: `stack-contract.yaml` (`approved_stack`).
- The order each tool is tried in, per data field: `provider-routing.yaml`. That file is the machine-readable mirror of the stack contract, which owns the order (`approved_stack` rule 4, and the email waterfall recorded in `lead_data.contact_enrichment.notes`). When they disagree, the contract wins, then the routing file, then any order written in a skill's prose.
- What each approved tool can and cannot return, and what is still unverified: `provider-capability-matrix.md`.
- The email verification doctrine (the email verifier checks every email from every source, verify-first, catch-alls shipping labelled `catch_all` (operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`), the ban on discovering people from search-engine results): `/email-waterfall`.
- The gate before copy: `verified-list-gate.md`.
- The lead score and its P1 to P5 bands: `/lead-scoring`.
- The list workbench rules (zero workbench credits, webhook pushes, the CSV as the working copy): `stack-contract.yaml` `lead_data.list_workbench`.

## 1. The flow

```
Market research -> offer -> buyer map
  -> TARGETING SPEC (profiles/<slug>/targeting-spec.yaml)            section 3
  -> 25-account validation, companies AND buyers                      section 4
  -> company discovery (AI Ark company sample and keyword mining, then the GetLeads export; a lookalike only as the exception)
  -> account QA after the provider: headcount, geography, exclusions  section 5
  -> people discovery at the fit companies (GetLeads)                 section 6, waterfall A
  -> title classification: rules first, sub-agents only for ambiguous section 7
  -> lead scoring (buyer tier feeds the role component)
  -> same-person email waterfall, every candidate verified at once     waterfall B
  -> person fallback when a person's waterfall is exhausted            waterfall C
  -> stop when the account has its required contacts                  waterfall D
  -> optional phone waterfall                                          waterfall E
  -> normalization, suppression, dedupe, 6-dimension QA               section 10
  -> aggregate anomaly QA against the spec                            section 11
  -> manual stratified QA by an independent reviewer                  section 12
  -> campaign-ready list + rejected + review + holdback + stagger     section 13
  -> post-QA send file pushed to the list workbench                   section 13
  -> campaign -> results feed back into targeting and routing         section 15
```

No record goes from a provider straight into a campaign. Every row reaches `leads.verified.csv` only through the waterfall planner and the list QA.

**Fit before contact data.** The order is company fit, then buyer fit, then contact data, then verification. Never find an email first and then look for a reason the person fits.

**The first wave is the whole eligible TAM** (Aaron process alignment, operator directive 2026-09-22). P1 to P5 is processing and send order, never a hold. The per-account cap (waterfall D) decides how many people at one company are emailed at once, and everyone else waits in the stagger queue for a later wave. The QA in this standard removes bad rows; it never shrinks the wave into a pilot.

## 2. The scripts (deterministic, no network, no spend, except the verifier CLI)

| Script | Job |
|---|---|
| `scripts/title_classify.py` | Classifies every title on function and seniority separately, maps it to a buyer tier, and writes only the distinct ambiguous titles to a queue for a Claude Code sub-agent pass. `--emit-scoring-tiers` writes `score_role_tier` and `score_authority_tier` for `/lead-scoring`. |
| `scripts/list_waterfall.py` | The planner and ledger for waterfalls A to E. It never calls a provider: it says what to try next, per account and per person, `record` appends what came back, and state is recomputed from the append-only ledger every time. Order, required inputs, depth caps, retries and each provider's concurrency all come from `provider-routing.yaml`. |
| `scripts/millionverifier_verify.mjs` | The CLI for the email verifier of record (`lead_data.email_verification`). Checks the shared verification cache first, dedupes within the file, verifies only what is new, and writes every final verdict back to the cache. It is the one script here that calls a vendor and spends credits. |
| `scripts/list_qa.py` | Normalization, the 6-dimension row gate, dedupe, suppression, account density, aggregate anomalies, the 9-dimension grade, the stratified manual-QA sample, and the separated output files. |
| `scripts/list_feedback.py` | After launch: joins the sending platform's results back to each lead's provenance (buyer tier, function, email source, headcount band) and writes the feedback report. |
| `scripts/lead_score.py` | The 10-point score arithmetic (`/lead-scoring`). |

## 3. The targeting spec

`profiles/<slug>/targeting-spec.yaml`, template `targeting-spec-template.yaml`. It is the one machine-readable answer to "who may this build target." `/tam-build` step 0 compiles it from inputs that already exist: `icp_hard_filters` (including `excluded_titles` and `excluded_domains` where the profile carries them), the locked offer's `offer.title_stack`, `offer.offer_fit_disqualifiers` and `offer.icp_inclusion` (per segment where `offer.segments` exists), and the rubric's persona mappings when present. It never invents a buyer; every family, title and exclusion is traceable in `compiled_from` and `changes`.

**If the targeting logic is unclear, stop before a large pull.** Concretely: no locked offer, no buying function, or no function family the spec can be built from. Under `auto_execute` Claude compiles the spec itself from the locked inputs and proceeds; it stops only when those inputs are missing, which is the same stop `/tam-build` already has for an unlocked offer.

**Fit versus timing.** Everything in `account` and `buyers` is fit ("should this company or person ever be targeted for this offer?"). Timing signals sit in `account.timing` and raise priority; they never gate a good-fit account unless the campaign is literally built on that signal (`timing.required`).

**One buyer-priority scale.** The spec's role tiers are the buyer priority: `exact` = buyer P1, `strong` = P2, `influencer` = P3, `adjacent` = P4, `weak` = P5. They are not the lead-score `priority_tier` (P1 to P5 on the 10-point score). Buyer priority decides who to reach first at an account; the lead score orders the whole list. Anything keyed on "P1 person" in this standard means buyer tier `exact`.

## 4. The 25-account validation (before any scale spend)

`/tam-build` runs it on the Phase A sample, before Phase B (the full list build and its paid enrichment). It reviews the targeting logic before money is spent. It is never a sending pilot, and it never shrinks the first wave. It has two parts:

1. **Company check.** An independent sub-agent that never saw the fit prompt judges 25 stratified accounts on five checks (buyer role plausibly exists, not excluded, in geography, in size band, can use the offer). PASS is 20 of 25 agreeing with no excluded account kept as good. Owner: `/tam-build`.
2. **Buyer probe.** On the accounts the reviewer marked `belongs`, run the first people-discovery rung in `provider-routing.yaml` `layers.people_discovery` (Layer-1 cost only: a people search with no email reveal), at the concurrency the routing file allows for that provider. Its per-call cost is not yet verified, so it is priced through `/api-cost-governance` like any paid call. Classify the returned titles with `title_classify.py`. Report: accounts where a target person was found, the buyer-tier mix, the most common failed and ambiguous titles, obvious false positives (a target title at the wrong function), and target titles the spec is missing (a title a person would call a buyer that the rules failed). **PASS** = a target person (buyer tier exact or strong) found at 12 or more of the probed accounts AND no systematic false positive (the same wrong function passing 3 or more times). On FAIL, fix the spec (families, patterns, explicit titles, exclusions) and re-probe, at most two rounds, exactly like the company check. The buyer probe exists to fix the targeting spec before a 20,000-row pull, instead of filtering a bad pull afterward.

Record both in `tam/tam-build-report.md` under `## 25-account list QA`. `run_state.status.list_qa_stage` is `passed` only when both parts pass. Failing twice stops before Phase B spend (a GO-gate condition, `/tam-build`), under `auto_execute` too.

## 5. Account QA after the provider (provider filters are a first pass, never the final check)

Never assume a provider applied headcount, geography, industry, title, seniority, department or current employment correctly because the filter was sent. After every company pull:

1. **Post-filter every row against the spec**, not against the request. Size filters are often bucket-based and return whole overlapping buckets by design (the filter caveat in `/tam-build` Layer 1a); other providers leak for their own reasons.
2. **Headcount distribution check.** Bucket the pull by `expectations.headcount_bands` and compare to `account.headcount`. A share outside the range above `expectations.max_share_out_of_headcount_range` is a CRITICAL provider-filter anomaly: the offending rows are gated out before any enrichment spend (kept in `tam.csv` as `qualified_out`, never deleted, per `/tam-build`), and the anomaly (with the source that produced it) goes at the top of the build report. Example: requested 20 to 499, 48% of rows under 20. Do the same for geography against `expectations.max_share_out_of_geography`.
3. **Escalate only uncertainty.** Headcount decides eligibility, but one provider's number is re-checked only when it is missing, borderline (within `borderline_pct` of a bound), or conflicting between sources, through `provider-routing.yaml` `layers.headcount_crosscheck` (at most one extra check per account). A confident in-range count is never re-bought. Headcount from a contact database is usually a count of employee profiles or a size band, which under-counts field-heavy businesses, so borderline is judged generously and never auto-dropped. Which approved tool returns which form is recorded in `provider-capability-matrix.md`; treat it as unverified until it is recorded there.
4. **Record provenance**: `headcount_source`, and the raw value next to the band.

## 6. The waterfalls

Each field has its own waterfall, each waterfall has its own success test, and **a failure advances only the layer that failed.** A failed email is not a failed person. A failed people search at one provider is not proof the account has no buyer.

### Waterfall A: people discovery (Aaron flow, see aaron-flow.md section 6; operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`)

**The per-account, next-provider model below is retired.** Discovery now runs in the house order: an AI Ark company search per vertical on a sample of 200 to 300 companies, fit scored, with every keyword and industry common to the good-fit companies mined as an include and every one common to the bad-fit companies as an exclude; the refined search then runs as the full company export in GetLeads (`count_contacts` gives the exact size at 0 credits), company fit is judged once per `company_domain`, and GetLeads finds the offer's title stack at the `good` and `maybe` companies, every row carrying `linkedin_url`. AI Ark may run the same export and people search in parallel, deduped (by `company_domain`, then by LinkedIn slug and email), only if it is fast; it is a parallel source, never a next rung. The full procedure (the sample, the keyword mining, the request body, the standing excludes, the export) is `outbound/reference/ai-ark-people-discovery.md`; it is not restated here. Prospeo is not a people-discovery rung.

- **Success is still TARGET_PERSON_FOUND, not PERSON_FOUND.** The search's title stack and seniority filters narrow for this up front, but every returned person still goes through title classification: a Head of Engineering returned for a Revenue Operations search is a person found, not a target person.
- Before accepting a genuine zero for an account, the widened net is a broader GetLeads people search on that company (more title variants, a loosened seniority band), never a second tool.
- Never invent a contact, never loosen the targeting automatically, never discover people from search-engine results.
- **Stop:** the account's companies hold the required target persons after the GetLeads people search and title classification, or the widened search still leaves it short (then PERSON_NOT_FOUND, PERSON_FOUND_NO_TARGET, or TARGET_PARTIAL, recorded per account).

Mechanics: the GetLeads people search at the shipped companies (`list_waterfall.py plan --layer people` plans the per-company pass), plus `aiark_people.mjs plan|pull` only when the parallel AI Ark search runs, merge into `contacts.csv` deduped by person, run `title_classify.py`, `record`.

### Waterfall B: make the SAME person campaign-ready (email)

**Rung 0 is the reservoir** (`reservoir.py lookup`, a MillionVerifier `ok` within the last 90 days; Aaron flow, see aaron-flow.md section 7; ruling `every-email-verified`), checked before any row's own carried email or a fresh finder call. Order after that: `layers.email.order`, which mirrors the contract's recorded order (operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`): GetLeads by LinkedIn URL, then AI Ark, then Prospeo, with the email verifier after each rung. For each active person:

- Rows that already carry an email go to verification first; no finder runs on them.
- Otherwise the next rung runs. **Every candidate email is verified by the email verifier as soon as it is found**, before the next rung, so the waterfall stops the moment a usable email exists. Never collect candidates from every rung and verify at the end.
- A candidate is **accepted** only on a verifier `valid` (the address accepts mail and the domain is not catch-all) or a verifier `catch_all`, on the person's own company domain (operator directive 2026-10-06, see `standing-rulings.md` `catch-all`).
- `invalid` (disposable counts as invalid) or `unknown` rejects that candidate and the waterfall continues for the same person. Transient failures (a verifier error, a timeout, a rate limit) are retried with backoff, then treated as `unknown`; a transient result is never cached.
- **A verified `catch_all` ends that person's email waterfall and ships, labelled `catch_all`** (operator directive 2026-10-06, see `standing-rulings.md` `catch-all`). It is never sent on to a later rung (`layers.email.on_catch_all: stop`, per the contract's `lead_data.email_verification` and `lead_data.contact_enrichment` notes). Until the planner gains a ship option it still writes the address to `leads.catchall-holdback.csv`, which is merged into the campaign file, labelled, after list QA. The person counts as exhausted (`EMAIL_CATCH_ALL`), so waterfall C promotes the next approved person at the account.
- **A later rung never runs on a person the rung before it has not attempted** (`requires_attempted` in the routing file: AI Ark only after GetLeads, Prospeo only after AI Ark). An outage no longer opens it: the only way through is an operator-approved skip (see the stop conditions below).
- Route the AI Ark rung through its single-person endpoint (`aiark_email_single.mjs`, `/v1/people/export/single`), which bills only when an email is found, never its bulk export path, which bills per profile even on a miss (`lead_data.contact_enrichment.notes`). The provider-specific detail lives in the routing file's provider notes.
- A valid email on a different, non-consumer domain is kept as a fallback (review later), not accepted.
- A consumer-domain candidate (gmail and the rest) under `personal_email_policy: fail` is rejected **without** paying to verify it.
- **Stop:** a verifier `valid` is found (stop now, call no more providers), a verified catch-all is found (ships labelled `catch_all`), every rung is used, or the person's depth cap (`max_rungs_by_role_tier`) is reached.

### Waterfall C: person fallback

When a person's waterfall is exhausted without a `valid`, the planner promotes the next approved person at the same account, in buyer-priority order, and runs waterfall B for them from the first rung. **Priority before coverage:** a lower-tier person is only activated when every higher-tier person ahead of them is exhausted or already ready. Do not abandon a found P1 because the first rung lacked their email; the whole waterfall runs for them first.

**The contact file handed to the email step keeps every eligible person at each account**, with rank 3 and beyond marked (`same_wave_eligible = false`) rather than cut. A file trimmed to the same-wave pair first leaves the planner nobody to promote, so person fallback would pass every test and never fire on a real build.

### Waterfall D: every verified contact ships, ordered round-robin by company

**No per-account contact cap** (Aaron flow, see aaron-flow.md section 13; ruling `no-contacts-cap`; replaces the former `buyers.contacts_per_account` default-2 stop and its `same_wave_contact_cap` mirror). Every person who clears Waterfall B's `valid` bar at a fit company goes into the campaign; nobody is held back as "not needed this wave."

**Stop:** there is no per-account stop here. Waterfall D now only orders the send file: `list_qa.py` writes it round-robin by company inside each priority tier (the spec's buyer-priority order), so one company is never all sent on the same day.

**The planner still owns active-wave membership for priority, not for count.** A promoted person keeps `wave_slot = promoted_fallback` with a `wave_slot_reason` naming who was exhausted above them; that field now tracks priority-fallback order only, since there is no per-account cap left to enforce.

### Waterfall E: phone (only when needed)

Runs only when the spec sets `buyers.phone_required: true` (a calling campaign, a client requirement, a multichannel play), and only on persons who are already campaign-ready by email. Order: `layers.phone.order`. The routing file carries no phone layer until a phone source among the approved tools is confirmed in `provider-capability-matrix.md`; until then a campaign that needs phones says so at the top of its report and never guesses a tool. **Stop:** the first phone found, or every rung tried (PHONE_MISSING). Phones are normalized (digits, leading +). No phone validator exists in the approved stack, so a phone is "found," never "verified."

### Stop conditions, in one place

| Waterfall | Stops when |
|---|---|
| A people | the account holds `min_target_persons_per_account` title-fit people, or every people provider was tried |
| B email | a verifier `valid` on the company domain, a verified catch-all (ships labelled `catch_all`), every rung used, or the tier's depth cap reached |
| C fallback | the account is satisfied, or no approved person is left |
| D ordering | no cap (Aaron flow, see aaron-flow.md section 13): every verified contact ships, round-robin by company inside each priority tier |
| E phone | first phone found, or every phone rung tried |
| Account QA | ICP fail confirmed, or the account passes |

A row whose required input is missing (no domain, no name for a finder) skips that rung for that row, logged and never faked. A tool that is out of balance, down (key missing or rejected, connector down after two retries) or switched off is different: the step stops, progress is saved, and the operator is asked to top up or fix it, then the run resumes on that same tool (`/tool-balance-guard`, operator decision 2026-09-28; this retires the old SANCTIONED EXCEPTION that let an observed outage open the gap-fill). A tool is never swapped for another and a rung is never skipped to get around it. The one way through is the operator saying so in chat for that step of that run: `list_waterfall.py plan --skip-provider <key> --skip-reason "..." --operator-approved-skip` (the planner refuses a skip without the flag, and the ledger records `detail.operator_approved`); only then may a later rung take persons the skipped rung never attempted. A `429` rate limit is retried, not stopped. A prediction that a provider might fail never skips it (the NO PRE-EMPTIVE SKIP rule in `/email-waterfall`).

**A low find rate never holds verified rows.** Email yield is not a send gate (`/email-waterfall`; Aaron process alignment, operator directive 2026-09-22). Every verifier-`valid` row ships, catch-alls ship labelled `catch_all` (merged from the holdback file after list QA; operator directive 2026-10-06, see `standing-rulings.md` `catch-all`), and rows no rung could close go to review. A low yield is reported as evidence for the routing review in section 16.

### Buyer priority and enrichment depth

`layers.email.max_rungs_by_role_tier` caps how many rungs each buyer tier may use. The default is the full waterfall for every tier. The routing file records that GetLeads bills 1 plan credit per email found, that AI Ark's single-person endpoint bills only when it finds an email, and that Prospeo bills nothing when it finds nothing, but Prospeo's price itself is unconfirmed, so cheapest-first is not yet established (operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`; `lead_data.contact_enrichment.notes`). Either way, the real cost levers are the per-account stop (D) and not enriching people the account does not need. Lower a tier's cap only with a measured cost reason, logged in `provider-routing.yaml`.

## 7. Title matching (deterministic first, sub-agents only for the ambiguous)

`title_classify.py` judges function and seniority separately. Seniority alone never passes a title: "Head of Engineering" fails for a Revenue Operations offer even though "Head" is a target seniority. Order of rules:

1. **Status exclusions** (retired, former, intern, student, open to work) fail outright.
2. **Role exclusions** from the spec fail a pure match. A mixed title that also carries a target role ("CEO and Medical Director") goes to review instead.
3. **Explicit titles** in the spec.
4. **Target function + seniority** mapped to a tier by the spec's `role_tiers`, then company-size overrides.
5. **A non-target function** (engineering, legal, compliance, HR, finance, IT, security and the spec's own list) fails, whatever the seniority.
6. **General leadership titles** with no function word (CEO, President, Owner, Founder, Managing Director) get their tier from company size (`generic_executive`).
7. **Individual-contributor titles** with no target function fail.
8. **Everything else is `ambiguous`.**

Only the distinct ambiguous titles go to an AI pass, and in this workspace that pass is Claude Code sub-agents, never a model API (the no-AI-API rule, CLAUDE.md section 7). Title fit is a judgment on one item, so per the `/ai-model-routing` model tiers it runs on the mid tier (the Agent tool's `model: "sonnet"`), and the session itself settles any title the sub-agent marks unsure. It moves down to `haiku` only after the 20-row agreement check in `/ai-model-routing`. It returns one verdict per title in the shape below, merged back with `--merge-ai`. A title that appears 100 times costs one verdict. `--emit-explicit-titles` writes the verdicts as a YAML snippet for review; the reviewed snippet is copied into the spec's `explicit_titles` and logged under `changes`, so the next run decides those titles by rule.

```json
{"title_normalized": "chief commercial officer", "function_fit": true, "seniority_fit": true,
 "offer_relevance": "strong", "title_role_tier": "strong", "reason": "owns revenue strategy at most mid-market firms"}
```

A blank title is `missing` (unknown evidence), never a fail: `TITLE_UNKNOWN` is not `TITLE_FAIL`.

## 8. States (missing is not failed)

| Level | States |
|---|---|
| Account | `ACCOUNT_PENDING`, `ACCOUNT_PASS`, `ACCOUNT_FAIL` (QA); `TARGET_PERSON_FOUND`, `TARGET_PARTIAL`, `PERSON_FOUND_NO_TARGET`, `PERSON_NOT_FOUND` (waterfall A); `ACCOUNT_IN_PROGRESS`, `ACCOUNT_SATISFIED`, `ACCOUNT_PARTIAL`, `ACCOUNT_NO_READY_CONTACT` (waterfalls B to D) |
| Person | `ACTIVE`, `WAITING`, `NOT_NEEDED`; `EMAIL_PENDING:<provider>`, `VERIFY_PENDING`, `READY`, `READY_REVIEW`; exhausted as `EMAIL_CATCH_ALL` (ships labelled `catch_all`), `EMAIL_DOMAIN_MISMATCH`, `EMAIL_INVALID` or `EMAIL_MISSING`; `PHONE_MISSING` |
| Title | `pass`, `fail`, `ambiguous`, `missing` |
| Row (QA) | `pass`, `reject`, `review`, `holdback`, `stagger` |

Pairs that must never collapse: `EMAIL_MISSING` vs `EMAIL_INVALID`; `TITLE_UNKNOWN` vs `TITLE_FAIL`; `HEADCOUNT_MISSING` vs `HEADCOUNT_OUT_OF_RANGE`; an unresolved catch-all vs an invalid email; `PERSON_FOUND` vs `TARGET_PERSON_FOUND`. The fallback logic depends on each distinction.

## 9. Attempt history, provenance and the verification cache

**The ledger.** `<campaign>/_waterfall/ledger.jsonl` is append-only; state is recomputed from it, so there is no mutable status file to drift. One line per attempt (provider keys are the ones `provider-routing.yaml` defines):

```json
{"ts": "...", "layer": "email", "provider": "aiark", "company_domain": "acme.com",
 "person_id": "li:jane-smith", "result": "found", "value": "jane@acme.com",
 "email": "jane@acme.com", "cost_usd": 0.0, "detail": {}}
```

Layers are `people`, `email`, `verify`, `phone`, plus control lines that skip or unskip a provider for the run. This gives retry prevention (a completed attempt is never repeated), resumability (a new session reads the ledger and continues), provider benchmarking, and debugging.

**Person attempt history** comes out of the ledger as `_waterfall/person-attempts.csv`: every person tried at each account, in order, with each rung's result and every candidate email with its verdict. **Account status**: `_waterfall/account-status.csv`.

**Row provenance on the send file:** `person_id`, `email_source` (the provider that found the accepted email, or `row_existing`), `email_attempt_path` (for example `getleads:not_found > aiark:valid`, or `getleads:invalid(j@a.com) > aiark:not_found > prospeo:valid`), `email_verified_at`, `verification_provider` (the verifier's name from the routing file), `verifier_raw_status`, `wave_slot`, `wave_slot_reason`, `title_raw` beside `title_normalized`, `title_rule`, `title_classifier`, `headcount_source`, `country_source`, and the existing `source`, `source_arm`, `evidence_url`. AI Ark's own reveal-time catch-all label (the second rung since 2026-10-06) is kept as its own column too: a second catch-all signal, never the send-gate (contract, `lead_data.contact_enrichment.notes`). Raw values are never overwritten: normalized values sit in `*_norm` companion columns.

**The verification cache.** `outbound/profiles/_cache/verify-cache.jsonl` (gitignored with `profiles/`), keyed by the lowercased email, holding the verdict, the raw status, the catch-all flag and the date. `millionverifier_verify.mjs` reads it before paying and writes every final verdict to it; transient results are never cached. Within one run the planner also never queues an email twice: the same email returned by two providers, or for two people, is verified once. Verdicts older than 90 days (`layers.verification.cache.max_age_days`) are re-verified. A cache hit is still a verdict from the verifier of record, never an exemption from the verifier rule. The vendor's public test key returns random verdicts, so a smoke test runs with `--no-cache` or a scratch cache path, never against the shared cache. **The cache is append-only live state: never move, quarantine, rewrite or delete `profiles/_cache/`; every writer only appends, each verdict is also mirrored to `profiles/<slug>/verify-cache.jsonl` when the input sits under that client folder, both files are read with the newest `verified_at` winning, and a missing shared cache is warned about on stderr, never silently started empty.**

## 10. Row QA: normalization, suppression, dedupe, and the 6-dimension gate

`list_qa.py run` on the waterfall's `leads.verified.csv`. Normalization first (names, email, domain, LinkedIn slug, country, headcount band), raw values kept.

**Suppression** is one resolver, run on every list, with every source in one place:
- `profiles/<slug>/suppression-list.csv` (email, LinkedIn, whole domain for `negative_hostile`, normalized company name);
- the spec's account exclusions (client, competitors, existing customers, internal domains);
- the spec's contact exclusions;
- the leads already active on the sending platform (`--active-leads`, an export of the client's leads from the platform locked in `run_state.sending_platform`), which catches cross-campaign duplicates. That export's column names are unverified until the platform is live, so check the columns the script read against the export before trusting a zero-duplicate result. Before the platform holds any lead, the flag is simply omitted.

**Dedupe** at contact level (same email, same LinkedIn) and person level (same first name + last name + company). No per-account density cap (Aaron flow, see aaron-flow.md section 13; ruling `no-contacts-cap`): every deduped contact at a fit company ships; `list_qa.py` orders the file round-robin by company inside each priority tier instead of staggering an account's contacts out of the wave.

**The 6-dimension gate.** Every row is judged on six dimensions. Critical failures are never hidden inside one blended score.

| # | Dimension | FAIL (reject) | REVIEW (hold) | WARN (ships, flagged) |
|---|---|---|---|---|
| 1 | ICP fit | headcount out of range, outside geography, excluded industry, excluded account | | headcount missing or borderline, country missing |
| 2 | Title / function fit | title fails classification | title ambiguous or missing | |
| 3 | Seniority / buyer fit | | | seniority unknown (buyer tier adjacent/weak is INFO) |
| 4 | Company / domain match | provider says the person works elsewhere; personal email when policy is fail | email domain differs from company domain; personal email when policy is review | title names another company |
| 5 | Contact quality | not verifier `valid` or `catch_all`; broken name (blank, placeholder, role word, digits or URL, first equals last, equals company) | catch-all (to the holdback file, then merged back into the send file labelled `catch_all` after QA); last name missing | initial-only first name, role mailbox, LinkedIn missing |
| 6 | Suppression / risk | suppressed, excluded contact, already active in another campaign, duplicate | | |

**Severity.** CRITICAL rows are rejected. REVIEW rows wait in the review queue (catch-alls pass through the holdback file and are merged back, labelled `catch_all`, after QA; operator directive 2026-10-06, see `standing-rulings.md` `catch-all`). WARNING and INFO rows ship with the flag recorded. A row is campaign-ready only when it is the right account, the right person, the right function and seniority, relevant to the offer, reachable at a verified email, and safe to contact.

**A systemic block stops the whole list**, because nothing in it is trustworthy and dropping rows would hide the fault. There are three causes, the same ones `/list-quality-scorecard` Step 1 names: an unverified row in the send file; contacts discovered from search-engine results, or names a source constructed from a pattern; and scoring leakage as the scorecard defines it (a row with `send_eligible = true` whose `score_reason` shows a classified `unrelated` role, or both market and offer classified `none`; never re-derived from points, and a blank tier is never leakage), plus any row `/lead-scoring` marked `send_eligible = false` that reached the send file. Each names the upstream step to fix.

## 11. Aggregate QA: the shape of the list

Row checks miss systematic problems, so `list_qa.py` also measures the input and the output against the spec:
- **Distributions:** company size bands, buyer tier, function family, seniority, country, email source, source arm, email status, fit status, rules versus sub-agent title decisions.
- **Anomalies:** out-of-range headcount share, out-of-geography share, non-target-title share (each CRITICAL above its `expectations` threshold); missing-headcount share and a thin top-two-tier share (WARNING); duplicate share above 5% (WARNING).

An anomaly never stops the list by itself, because the offending rows were already rejected row by row. It leads the QA report, it is attributed to the source or provider that produced the rows (for example, 41 of 52 under-20 rows came from one source arm), and it opens the fix loop in section 14.

## 12. Manual stratified QA (an independent reviewer, not the classifier)

`list_qa.py` draws `qa-sample.csv`: 25 rows for a list under 1,000, 50 under 5,000, 100 above. Every buyer tier, size band, country, email source, source arm and "rules versus sub-agent" title decision is covered at least once before random fill (promoted fallbacks and sub-agent-classified titles first). Five rejected rows are added as a false-negative control.

The reviewer checks each row against the company's own site (WebFetch) and public web results (WebSearch): right company, right title for the offer, still employed there. LinkedIn profiles are read only when the operator pastes them in this workspace, so a reviewer that cannot see the person on either source answers `unsure`, never a guessed `yes`. Answers are `yes`, `no` or `unsure`; an `unsure` is left out of the share, and current employment is judged only once 5 or more answers are determinable.
- **Under `auto_execute`:** a fresh Claude Code sub-agent that never saw the classifier's verdicts does the review, the same pattern as the 25-account QA, so no human pause is added.
- **Under `review_gates`:** the operator sees the sample and the verdicts.

`list_qa.py score-sample` scores it. **PASS** = at least 90% correct company, 90% correct title and 90% currently employed, with no systematic failure (3 or more misses sharing one source, function or band). A FAIL routes to the fix loop before copy; it never silently drops the sample rows and ships.

## 13. Outputs (one status per file)

| File | Holds |
|---|---|
| `leads.verified.csv` | Campaign-ready rows only, every QA column included. The file copy and upload read. |
| `leads.verified.pre-scorecard.csv` | The input before QA, so every removal is auditable. |
| `leads.rejected.csv` | CRITICAL rows with their reason codes. |
| `leads.review.csv` | Rows waiting for a decision: no email, invalid, domain mismatch, ambiguous title, personal email under review. |
| `leads.catchall-holdback.csv` | Verified catch-alls, as the planner and `list_qa.py` still write them. They are not held: after list QA they are merged into the campaign file, labelled `catch_all`, until the scripts gain a ship option (operator directive 2026-10-06, see `standing-rulings.md` `catch-all`). |
| `leads.stagger.csv` | Approved people not needed this wave (account already satisfied, or density overflow). Never deleted. |
| `email-waterfall-report.md` | The waterfall run, including the provider table. |
| `list-qa-report.md` | The QA report (section 14 format). |
| `qa-sample.csv` | The manual QA sample and, once reviewed, its verdicts. |
| `_waterfall/` | Ledger, queues, person attempts, account status. |

**The list workbench gets the send file only after QA.** Push `leads.verified.csv` to the client's send-list table (`scripts/workbench_push.mjs --table send_list --stage verified`) only once `list_qa.py` has run on it and the catch-alls have been merged back in, labelled `catch_all` (operator directive 2026-10-06, see `standing-rulings.md` `catch-all`). List QA rewrites that file (rejected, review, holdback and stagger rows leave it), and a workbench webhook has no upsert: a second push appends every row again as a duplicate, and the script refuses a repeat push of the same file unless forced. So a push made before QA leaves the table holding rows the send file no longer has. An edit the operator makes in the workbench comes back only by manual export, and that export is a new send file: re-verify any email that changed, then run `list_qa.py run` on the export before upload. Strip the earlier QA columns from it first, or the script refuses it as already QA'd. Do not use `--rerun` for this, because `--rerun` re-reads `leads.verified.pre-scorecard.csv` and would silently drop the operator's edits. The zero-workbench-credit rule applies throughout (`lead_data.list_workbench.credit_policy_rule`).

## 14. The QA report and the fix loop

`list-qa-report.md` opens with the verdict, then any CRITICAL anomaly with its source and fix, then:
- what was built (N campaign-ready contacts across M companies);
- the distributions;
- removed during QA, by reason (suppressed, broken names, wrong company, irrelevant titles, out of ICP, not verified, duplicates, already active);
- the 6-dimension table and the 9-dimension grade (`/list-quality-scorecard`'s dimensions, graded on the remainder, with its Dimension 5 marked N/A unless the copy cites a row-level signal);
- manual QA as "X/Y correct company, X/Y correct title, X/Y current employee";
- the issues caught.

It describes what was checked, never just "list cleaned."

**The fix loop.** When QA fails, do not just delete the bad rows. Ask why they got in, fix that, and re-run:

| Symptom | Likely cause | Fix |
|---|---|---|
| Engineering titles in a RevOps list | title rule too broad | tighten the spec's family patterns or add a non-target function, re-run `title_classify.py`, re-QA |
| Under-range companies | provider size filter leaking | post-filter at account QA, cross-check the source, re-QA |
| Wrong-company contacts from one provider | provider current-employer data stale | flag the provider in the routing review (section 16), re-run that account's people waterfall |
| Many ambiguous titles | spec missing variants | add explicit titles from the reviewed sub-agent verdicts |

Every spec change is logged in the spec's `changes` list with its reason. After a spec-only change, `list_qa.py run --rerun` re-reads the pre-scorecard copy and re-judges it.

## 15. Campaign handoff and results feedback

**Handoff.** A list moves to copy only when `verified-list-gate.md` holds: a verified slice, the scorecard grade (B or better on the remainder after row-level cleanup), and a locked strategy. That includes a PASS from this standard's QA (no open systemic block, manual QA passed). Copy receives the campaign-ready leads with their offer, segment, buyer tier (`title_buyer_priority`), function family, message angle, and the signals the row actually carries.

**Feedback.** After launch, `list_feedback.py` joins the sending platform's lead export (`run_state.sending_platform`) to each lead's provenance, classes replies with the classes in `reply-scoring-core.md`, and reports:
- replies and positive replies by buyer tier, function family, seniority and size band;
- bounces by email source, which is the provider's real bad-data rate;
- campaign-ready rate by provider.

The export's status and bounce values are unverified until the platform is live, so the first real run checks them against the export before any number is trusted. The step is dormant until then.

It writes recommendations, never silent edits, for the targeting spec (tier or family changes), the routing order (section 16), and the offer-to-persona mapping. `/cold-email-weekly-rhythm` reads it with the other results and puts its recommendations in the digest as proposals only. For example: RevOps P1 has a high positive rate, CRO P2 a low one. Move the CRO title down a tier in the spec, log why, and the next build follows.

## 16. Cost-aware routing

For each recurring provider decision, the number to minimize is cost per final QA-passed contact:

```
coverage x accuracy x valid rate x unique incremental coverage / cost
```

Never the cheapest provider alone, never the one with the most records. The waterfall report's provider table carries each ingredient: found rate, verifier-valid rate, new valid contributions after earlier rungs (incremental coverage), and cost per new valid. A provider that adds almost no new valid contacts after the rungs before it is a candidate for removal from that waterfall, even though it is connected.

**Who changes the order.** An order change is a provider-routing decision, so it goes to the operator with the evidence (the Decisions rule in CLAUDE.md section 7). Once approved, the stack contract changes first (`lead_data.contact_enrichment.notes` records the email order), then `provider-routing.yaml` mirrors it: bump `routing_version` and set that layer's `evidence:` to where the numbers live. Never re-order a waterfall inside a skill's prose.
