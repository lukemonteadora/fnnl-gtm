# Market Evidence Standard

**What this is.** The one standard for how the cold-outbound flow collects, stores, counts, clusters, scores and quality-checks market research, and how campaign results flow back into it. Every research skill points here instead of restating it: `/offer-intelligence` (collects), `/market-evidence` (synthesizes, gates, and runs the feedback loop), `/lead-magnet-brainstorm` (builds offers from it), `/campaign-strategy` and `/campaign-copywriting` (use it), and `/cold-email-weekly-rhythm` (feeds it). Adopted in this workspace 2026-09-24. Every read route in it is Claude-native and costs nothing (section 9).

**The principle.** AI compresses the market; it does not invent it. A model saying something, however often, is not market evidence. Five layers are kept apart, each in its own place:

| Layer | What it is | Where it lives |
|---|---|---|
| 1. Raw evidence | The source itself: a page, a pasted thread, a call transcript, a reply, an export | `_research/runs/<run>/` (captures that cannot be re-fetched), or the source URL |
| 2. Extracted facts | One row per evidence item: verbatim quote plus the fields the source actually states | `_research/evidence.csv` (the evidence ledger) |
| 3. Interpretation | Clusters, counts, opportunity scores, the Research QA verdict | `_research/pain-clusters.md`, `_research/competitors-and-ads.md`, `offer-intelligence.md` |
| 4. Hypotheses | Offer, lead-magnet, segment and angle bets built on the interpretation | `lead-magnets.md` and `offer.validation_arms` (they cite cluster and evidence IDs) |
| 5. Tested market feedback | What prospects actually did and said after launch | Reply rows in `evidence.csv` (tier strong), results in `portfolio-review.md` and `experiments/`, the dated feedback log in `pain-clusters.md` |

## 1. Where the files live (per client)

```
outbound/profiles/<slug>/
  client-profile.yaml        research_artifacts: block = the research index; run_state.status.research_stage
  activity-log.md            the Research workstream line
  offer-intelligence.md      the research brief (synthesis + Candidate Generation Input, citing cluster IDs)
  lead-magnets.md            the offer hypothesis register (every candidate cites clusters and evidence)
  offer-validations/         validation runs
  _research/
    evidence.csv             the evidence ledger (append-only; written only by evidence_ledger.mjs ingest)
    pain-clusters.md         clusters, counts, opportunity scores, Research QA verdict, language bank, feedback log
    competitors-and-ads.md   competitor cards and paid-ad angles
    market-sample.md         the 10-25 named example companies the research is grounded on
    runs/<YYYY-MM-DD>-<purpose>/   raw captures and working notes for one research run
```

- **Run folders.** `<purpose>` is one of `discovery`, `validation`, `deepen-1`, `deepen-2`, `feedback`, `refresh`. Inside: `batch-<vector>-<n>.json` (ingest inputs), optional `<vector>-notes.md` (narrative working notes), raw captures named by how they were read (`paste-<platform>-<n>.md` for operator pastes, `browser-<site>-<n>.md` for browser-pane reads, `webfetch-<site>-<n>.md` for WebFetch reads, `websearch-<n>.md` for saved search results, `replies-<date>.json` for a reply pull), and `calls/` for transcripts or pointers to them.
- **Older research is referenced, never moved.** A client whose research was written before the ledger existed keeps those files where they are. The next research run for that client reads them at `/offer-intelligence` Step 0 and seeds the ledger from them, recording `raw_ref` back to the older file.
- **Everything under `profiles/` is gitignored.** Research is local-disk only, like all client data.

## 2. Evidence types and tiers

The tier comes from the evidence type. An extractor may lower a tier (say why in `notes`), never raise it.

| Tier | `evidence_type` | What counts |
|---|---|---|
| **strong** | `purchase_behavior` | A buyer paid for, switched from, or cancelled a product or provider, stated first-hand or observed |
| | `sales_call` | The client's recorded won or lost sales call (the buyer's own words to the client) |
| | `interview` | A customer or prospect interview we or the client ran |
| | `outbound_reply` | A real human reply to our campaign |
| | `support_issue` | A support ticket, churn reason or complaint the client logged |
| | `observed_workflow` | A workflow we watched (screen share, trial data, demo) |
| **good** | `forum_post` | A detailed first-person discussion (Reddit, forums, Hacker News, community Q&A, a detailed YouTube comment) |
| | `review` | A public review (G2, Capterra, Trustpilot, app stores) |
| | `competitor_case_study` | A competitor's named customer story (evidence someone bought for this reason; the claim itself stays marketing) |
| | `job_post` | A job posting that names the problem or the outcome the hire owns |
| | `rfp_requirement` | A procurement or RFP requirement |
| | `comparison` | A detailed hands-on product comparison |
| | `client_material` | The client's own notes about their buyers (CRM loss reasons, onboarding call). Second-hand: the client describing the buyer |
| **supporting** | `social_post` | A LinkedIn or X post |
| | `video` | Video content (not a detailed first-person comment) |
| | `ad` | A paid-ad angle (Meta, LinkedIn, Google). Evidence of demand for the angle, not of pain |
| | `competitor_claim` | A competitor's positioning, pricing or product page. Never counts as pain or proof |
| | `search_signal` | Search trends, People-also-ask, keyword volume |
| | `news` | News or an event. Timing only |
| **weak** | `seo_article`, `market_report`, `influencer_opinion`, `ai_claim` | Generic content, generic reports, opinion without data, model output without a source. May start a hypothesis; never confirms one |
| **hypothesis** | `model_hypothesis` | Persona research by a model (Vector 0) or the client's stated `buyer_pain_hypothesis`. Stored for tracking, **never counted as evidence** |

**A one-line mention is supporting, whatever the platform.** "Good" needs a first-person account with enough context to know the situation.

**`source_class`** (kept from the existing flow, and still what the 3-source floor counts): `buyer_quote` (a buyer describing their own problem in public), `first_party_call`, `outbound_reply`, `job_posting`, `competitor_claim`, `analyst_claim`, `news`, `model_hypothesis`. A competitor's own customer complaining in a review is a `buyer_quote` with `competitor_mentioned` filled.

## 3. The evidence ledger (`_research/evidence.csv`)

One row per evidence item. Several quotes from one thread, call or reply are several rows that share one `source_thread`, which is what makes them one sighting. Rows are appended only by `node outbound/scripts/research/evidence_ledger.mjs ingest`; nobody types rows into the CSV by hand. The only field a person may edit afterwards is `status`.

| Column | Required | Meaning |
|---|---|---|
| `evidence_id` | set by the script | `E-0001` onward |
| `status` | set by the script | `active`, `duplicate`, or `retracted` (a person may set `retracted` with a reason in `notes`) |
| `captured_at` | yes (defaults to today) | When we captured it |
| `run_id` | yes | The run folder name, e.g. `2026-09-23-discovery` |
| `collected_by` | yes | The skill and vector, e.g. `offer-intelligence:V3`, `market-evidence:feedback`, `operator_paste` |
| `evidence_type` | yes | From section 2 |
| `tier` | set by the script | Derived from the type; a lower tier may be supplied with a reason |
| `source_class` | yes | From section 2 |
| `source_url` | yes, unless `raw_ref` | The page, thread or review URL |
| `raw_ref` | yes for calls, replies, pastes | Path under `_research/runs/` (or the older research file) holding the raw capture |
| `source_site` | derived | Host or platform, e.g. `reddit.com`, `g2.com`, `sending-platform` |
| `source_thread` | derived | The independence key: one thread, page, call or reply thread = one sighting |
| `source_author` | yes (`unknown` allowed) | A handle or a role. **Never a prospect's name or email** |
| `source_date` | yes (`unknown` allowed) | When the source was written: `YYYY-MM-DD` or `YYYY-MM` |
| `persona` | yes (`unknown` allowed) | The role as the source states it. Never guessed to fill the field |
| `company_context` | no | Industry, size, geography as stated |
| `icp_match` | no | `yes`, `partial`, `no`, `unknown` |
| `exact_quote` | yes | Verbatim. Line breaks are stored as ` / `. Never cleaned up, never paraphrased |
| `situation`, `pain`, `trigger`, `workaround`, `workaround_gap`, `consequence`, `desired_outcome`, `alternative_considered`, `competitor_mentioned`, `objection` | no | Filled only when the source says it. Left blank rather than inferred. `workaround_gap` = why the current workaround is not enough |
| `confidence` | yes | `high`, `medium`, `low`: how sure we are the row is extracted correctly and is relevant |
| `syndication_of` | set by the script | The earlier ID when the same quote appears on another page (counted once) |
| `notes` | no | Anything else, including why a tier was lowered |

**Ingest input** is a JSON file (an array of rows, or `{"rows": [...]}`) using the column names above. Pointed at a run folder, the script reads only its `batch-*.json` files, so raw captures saved beside them are never mistaken for rows. Sub-agents write their own batch file in the run folder; the orchestrator ingests them (one output file per agent, merged by the script, per `/personalization-subagent-pattern`). The script validates every row, rejects bad ones with a reason, skips exact duplicates, flags syndicated quotes, assigns IDs and appends.

## 4. Counting rules (what "appeared N times" means)

- **A sighting is a unique `source_thread`.** Five people agreeing in one forum thread are one sighting, because they are reacting to each other. One sales call is one sighting however many quotes it gives.
- **A voice is a unique `source_author`** (unknown authors count once per thread).
- **A syndicated quote counts once**, wherever it was republished.
- **Hypotheses never count.** A `model_hypothesis` row cited as evidence for a cluster is a QA failure.
- **First-party and reply evidence are separate, stronger pools.** A single lost-deal objection or a single reply is reportable on its own, labelled with its type. They never inflate the public-source count, and public quotes never inflate theirs.
- **The 3-source floor stays.** A public pain is stated as pain only at 3 or more independent `buyer_quote` sightings; below that it is reported as low confidence, never dropped.
- **Honest prevalence language only.** Say "appeared across 18 discussions, 7 reviews and 4 sales calls". Never "30% of CROs have this problem" unless a quantitative source with its sample size is cited. Counts come from `evidence_ledger.mjs stats`, never typed by hand.

## 5. Pain clusters (`_research/pain-clusters.md`)

```markdown
# Pain clusters: <Client>
Updated YYYY-MM-DD · Ledger: <n> rows · Research QA: PASS | DEEPEN | HOLD (YYYY-MM-DD)

## Summary
<3-5 bullets: the top clusters, what they mean, how confident, what is still thin. Every bullet cites cluster IDs.>

## Cluster C-01: <the problem, in the buyer's words>
evidence: E-0003, E-0007, E-0011
counterevidence: E-0042
- **Who feels it:** <persona(s), and personas where it was not found>
- **Counts:** <pasted from `stats`, e.g. "9 sightings: 4 forum threads, 3 reviews, 2 sales calls; 8 voices; 78% within 24 months">
- **Trigger (when it becomes urgent):** ...
- **Current workaround:** ...
- **Why the workaround fails:** ...
- **Consequence:** ...
- **Desired outcome:** ...
- **Alternatives considered:** ...
- **Objections:** ...
- **Buyer language:** "<verbatim phrase>" (E-0007); "<verbatim phrase>" (E-0011)
- **Confidence:** high | medium | low, and why
- **Open questions:** ...

## Opportunity scores
## Research QA
## Language bank
## Market feedback log
```

- The `evidence:` and `counterevidence:` lines sit directly under each cluster heading, because `evidence_ledger.mjs stats` reads them. Everything else is prose for people.
- Cluster IDs are stable. A cluster that the evidence later splits keeps its ID on the larger half; merged clusters keep the older ID and note the merge. Never renumber.
- Every cluster stays visible, however weak. Weak ones are labelled and ranked, never deleted (operator directive 2026-09-22).
- Cluster by the problem the buyer has, not by the client's product features.

## 6. Opportunity scoring

Eight factors, 0 to 2 each, total out of 16. **A non-zero score must cite evidence IDs** (factors 1-5, 8) **or a profile field** (factors 6-7). A score with no citation is 0. The total orders the clusters; it never removes one.

| Factor | 0 | 1 | 2 |
|---|---|---|---|
| 1. Frequency | fewer than 3 sightings | 3 to 9 sightings | 10 or more, or 3 or more across 2 or more evidence types including a strong one |
| 2. Severity | an annoyance | time or cost lost, named | revenue, risk, compliance or a job on the line, named |
| 3. Urgency / trigger | no trigger found | a trigger exists | a trigger exists and the approved stack can detect it, or it recurs on a calendar |
| 4. Existing spend | none seen | tools or paid workarounds mentioned | clear money already spent: job posts, paid tools, agencies, competitor ad spend behind the angle |
| 5. Current-solution gap | solved well today | partial complaints | the workaround or the incumbent is clearly failing |
| 6. Reachability | cannot tell who feels it | identifiable roles, hard to filter | titles and company attributes the approved stack can filter |
| 7. Client can solve it | outside `capability_boundary` | partly, or proof is thin | squarely inside, with proof on file |
| 8. Evidence strength | supporting or weak only | good-tier evidence | at least one strong-tier item |

Ties break on evidence strength, then frequency. A compelling phrase is not a score: a cluster that reads well but cites nothing scores low, and that is the point.

## 7. Research QA gate

Run by `/market-evidence synthesize` before any offer is built. The mechanical checks come from `evidence_ledger.mjs stats`; the rest are judged against the files. Each check is PASS, FLAG or FAIL, with a note.

| # | Check | Mechanical? |
|---|---|---|
| Q1 | **Sources exist.** Every cluster statement traces to IDs; public rows have a URL; calls, replies and pastes have a `raw_ref`; no cited ID is unknown | yes |
| Q2 | **Recent enough.** At least 70% of a top cluster's dated rows fall within 24 months; older evidence is labelled historical, not presented as a trend | yes |
| Q3 | **Independent.** A top cluster has 3 or more sightings from 2 or more sites, or a strong-tier item | yes |
| Q4 | **Not one loud source.** No single thread supplies more than 40% of a cluster's rows | yes |
| Q5 | **Quotes are accurate.** A small-model sub-agent re-reads 5 random quotes against their sources; zero mismatches | spot-check |
| Q6 | **Assumptions marked.** No `model_hypothesis` row is cited as evidence; inferences are labelled as inference | yes (citation) |
| Q7 | **Specific to the ICP.** At least 50% of a top cluster's rows with a known `icp_match` are `yes` or `partial` | yes |
| Q8 | **Competitor claims are not facts.** No `competitor_claim` row is cited as pain or proof | yes |
| Q9 | **Traceable.** Every Summary bullet in `pain-clusters.md` cites cluster IDs | judged |
| Q10 | **No double counting.** Syndicated quotes counted once; the same underlying source is not cited as two | yes |
| Q11 | **Commercially meaningful.** The top cluster's consequence ties to money, time, risk or growth | judged |
| Q12 | **Reachable.** Opportunity factor 6 is at least 1 | judged |
| Q13 | **Client can solve it.** Opportunity factor 7 is at least 1 | judged |
| Q14 | **Coverage is honest.** Platforms read and unread are recorded, with why. A platform unread because of policy or an untested read route carries a paste reading list (section 9) | judged |
| Q15 | **Prevalence language is honest.** No percentage prevalence without a quantitative source | judged |

**Verdicts:**

- **PASS.** At least one cluster scores 10 or more out of 16 and passes Q1-Q10. Offer creation may begin. All clusters, including weak ones, go forward with their labels.
- **DEEPEN.** The gaps are fixable with more research inside this workspace (thin independence, stale evidence, an ICP mismatch, a readable platform the ICP uses that nobody read, a failed quote check). Write a deepen brief naming each gap and the vector or read route that fixes it, run Stage 2 on those gaps only, then re-run the gate. **At most two deepen loops.** After the second, the verdict is PASS with low-confidence labels, or HOLD. Under `review_protocol: phase_checkpoints` (the new-client default since 2026-09-24), research is one run: the deepen brief goes to `/cold-email-kickoff` checkpoint 2, and a loop runs only if the operator picks it there. **A platform unread because of policy is never a DEEPEN reason.** Reddit, G2, Quora or LinkedIn with nothing pasted, and a platform whose read route has not passed its test (section 9), are recorded as a stated coverage gap with a paste reading list for the operator. More research here cannot read them, so they never start a loop.
- **HOLD.** More public research cannot fix it: everything rests on hypotheses, the client cannot solve any cluster, or the ICP cannot be reached. Under `review_gates`, the operator decides at Gate 2 (the offer-step review defined in `/cold-email-kickoff`). Under `review_protocol: phase_checkpoints`, the HOLD reasons lead `/cold-email-kickoff` checkpoint 2 and the operator decides there. Under plain `auto_execute`, proceed with every cluster labelled low confidence, the HOLD reasons flagged at the top of the report, and the missing evidence (usually call recordings) requested from the client. Never a silent block, never a silent pass.

## 8. Staged depth

Research costs nothing here. The session, its sub-agents, WebSearch, WebFetch and the browser pane are not metered spend, so no research step draws on the standing $100 run budget and none needs a spend approval. Depth is set by quote counts and sub-agent counts instead of dollars.

| Stage | When | Scope | Depth |
|---|---|---|---|
| **Stage 1** | Every new client, market, segment or offer direction | Research sample (10-25 companies), first-party calls, persona hypotheses, 5-10 competitors, ad angles, job posts | 20 to 30 public quotes. One primary pass (the `/deep-research` harness, or its 4 to 8 sub-agent fallback). Up to 4 extraction sub-agents on the small tier, each on a disjoint set of raw captures |
| **Stage 2** | Only on a DEEPEN verdict, or before a high-stakes offer, and only on the named clusters and gaps | Readable platforms not yet read, competitor review mining, and a paste reading list for the platforms only a paste can reach | 50 to 150 more quotes on the named clusters, per loop. 2 to 6 sub-agents, one per named gap |
| **Stage 3** | Only after the offer locks | The list build (`/data-point-discovery` onward), with the 25-account list QA before Phase B spend | the existing list-build rules |

The primary pass still gets its one-line audit record in `scripts/api-balance-ledger.md` (no cost), per `/ai-model-routing`, so `research_routing_check.mjs` can see it. **Refresh research** when a new market, segment or offer direction starts, when `last_refreshed` is older than 90 days and a new wave is planned, or when market feedback contradicts a top cluster.

## 9. Research read routes (research only, never list building)

Every research read runs on Claude Code's built-in tools. No read route is a paid call, and none calls a third-party AI (the no-AI-API rule, CLAUDE.md section 7). Public pages only, read-only.

| Need | Route |
|---|---|
| Find the exact URLs | WebSearch. At volume (more than about 20 queries), fan the queries out across sub-agents, a disjoint query set each (`/personalization-subagent-pattern`). Search returns URLs; it never summarizes the discussion |
| Read a page | WebFetch |
| JavaScript apps and ad libraries (Meta, LinkedIn, Google and TikTok ad libraries; pages WebFetch cannot render) | The built-in browser pane: `mcp__Claude_Browser__navigate`, then `mcp__Claude_Browser__get_page_text`. Read-only: never log in, never fill a form, decline non-essential cookies, fan advertisers out across sub-agents (disjoint sets, one output file each) rather than checking them one by one. Never Claude in Chrome, which acts in the operator's real browser with their own sign-ins |
| Reddit, G2, Quora | Operator paste: the operator reads the thread in their own browser and pastes the text plus its URL, saved as `paste-<platform>-<n>.md`. Nothing pasted means the platform is unread |
| LinkedIn posts | WebSearch, where it returns a public post (quote only what the fetched page shows). LinkedIn engagers and post signals come from the data tool in `lead_data.intent_signals` (a data vendor under its own spend rules, not an AI provider; `/ai-model-routing`). Anything behind LinkedIn's login wall is operator paste |
| Review sites (Capterra, Trustpilot) | WebFetch |
| YouTube search, comments and transcripts | WebFetch or the browser pane, once the read-route test below passes for it. Until then it is a stated gap |
| Hacker News | Its free public Algolia API (`hn.algolia.com/api/v1/search`), read through WebFetch |
| X | WebSearch, where it returns public posts. Otherwise a stated gap |
| The primary research pass | The `/deep-research` harness (`anthropic-skills:deep-research`), logged `claude-deep-research`. When the harness is unavailable, the fallback is a logged flat fan-out of 4 to 8 research sub-agents from the same brief (one category each, disjoint output files, a post-merge uniqueness check), logged `claude-subagent-fanout`. A bare inline WebSearch answer never counts as the primary (`/ai-model-routing`) |

**Known read-route verdicts.** Add a dated row whenever a platform is tested.

| Platform | Route tried | Verdict | Date |
|---|---|---|---|
| reddit.com | WebFetch, WebSearch, the in-app browser | Refused. Operator paste only | 2026-09-22 |
| g2.com | WebFetch | HTTP 403. Operator paste only | 2026-09-22 |
| Trustpilot | WebFetch | Readable | 2026-09-22 |
| Capterra | WebFetch | Readable | 2026-09-22 |
| Hacker News (Algolia search API) | WebFetch | Readable | 2026-09-22 |
| YouTube (search, comments, transcripts) | WebFetch, the browser pane | Untested | |
| Meta, LinkedIn ad libraries | The browser pane | Readable | 2026-09-23 |
| Google Ads Transparency, TikTok | The browser pane | Untested | |
| Quora | none (policy) | Operator paste only | |
| LinkedIn posts | WebSearch; the intent-signals data tool for engagers | Public posts only where search returns them; the rest is operator paste | |

**Test a read route before trusting it.** Before a route's reads count as coverage for a platform that is untested or missing from the table:

1. Run it on a real query and check 2 to 3 of the returned URLs against the platform itself: the page exists, and the quote and author are there as returned.
2. Run one fabrication probe: search for something that does not exist (a made-up product or phrase). It must come back empty. A route that returns plausible results for a fake query is inventing them and is not a route.
3. An empty result is not proof of absence. A route that returns nothing for a real query may be refused, rate-limited or unable to render the page, so record the platform as unread, never as "no discussion found".
4. Record a dated verdict for the platform in the table above and in the run's coverage line (Q14).

**Unread platforms become a paste reading list.** When the ICP lives on a platform only a paste can reach (or one whose route is untested), record it under Q14 and in `research_artifacts.coverage_gaps_stated_honestly`, and give the operator a paste reading list: the exact thread or page URLs where WebSearch surfaced them, otherwise the communities and search terms to read, and which cluster each would test. Pasted text is ingested like any other batch, and the gate re-runs. The list is a request to the operator, never a DEEPEN trigger (section 7).

**Not routes in FNNL.** Their connectors may be visible in a session, but none is approved here (the six-tools rule, CLAUDE.md section 1, and the no-AI-API rule, section 7): Apify, Spider (including its AI and browser tools), Serper, Perplexity, Grok, SocialCrawl, DiscoGen. A tool showing up in a session is not permission to call it.

Collected review and forum text is for research and citation only, never redistributed as a dataset. Public pages only; never log in to a platform to read it.

## 10. Competitor cards (`_research/competitors-and-ads.md`)

Research what helps a GTM decision, not every field that exists. One card per competitor, 5 to 10 competitors (the denominator the saturation verdict needs):

| Field | Why it matters |
|---|---|
| Company, website, date read | Traceability |
| Who they sell to | Overlap with our ICP |
| Main promise (their headline, verbatim) | What the buyer has already been told |
| Front-end offer and its archetype letter | The saturation count |
| Pricing model or visible price | The buyer's reference point |
| Named customers and case studies | Evidence of who buys, and why (`competitor_case_study` rows) |
| Paid-ad angles, with variation counts and run length | Demand evidence for an angle (Vector 2) |
| Lead magnets | What the ICP is already being offered free |
| What their customers complain about | The gap (review rows in the ledger, cited by ID) |
| Strengths, as buyers describe them | What we must not pretend to beat |
| The gap they leave | The offer's opening |
| Sources | URLs and ledger IDs |

Competitor marketing is `competitor_claim`: context, never proof. Their customers' complaints are `buyer_quote` rows.

## 11. The research sample (`_research/market-sample.md`)

10 to 25 named example companies, found for free before any conclusion is drawn: the client's named customers and case studies, competitors' named customers, employers found through job posts, and search results that match the ICP. It grounds persona research and job-post reading in real companies and makes the ICP-specificity check (Q7) concrete. **It is not the seed set** (seeds are chosen for offer fit, after lock, by `/social-proof-bank`) and it triggers no paid lookup: no call to the discovery or enrichment tools before the offer locks.

| # | Company | Domain | Why it is in the sample (source) | Segment or persona | Used for |
|---|---|---|---|---|---|

## 12. Offer evidence (Offer QA)

Offers are hypotheses built on clusters. At lock (`/lead-magnet-brainstorm`):

- Every candidate in `lead-magnets.md` carries an **Evidence** line: the cluster IDs it answers, 2 to 4 evidence IDs, the strongest tier behind it, and the buyer language it borrows.
- Every `offer.validation_arms` entry (and the primary) carries `cluster_ids`, `evidence_ids`, `evidence_strength` (`strong`, `good`, `supporting`, `unevidenced`) and `pain_angle` (one line in the buyer's words).
- An offer with no cluster behind it is allowed. It is labelled `unevidenced` or `contrarian`, ranked on its rubric score, and still runs as an arm. The label exists so the read-out can tell a failed hypothesis from an untested one.
- After launch, `/market-evidence feedback` adds `feedback_ids` (the reply evidence IDs about that arm) and a one-line `feedback_summary` to each arm, and a dated Market feedback line to the candidate in `lead-magnets.md`. It never touches an arm's `status`, `read` or `flight`, which `/cold-email-weekly-rhythm` owns.

## 13. The language bank and copy

`pain-clusters.md` keeps a **Language bank**: per cluster, 3 to 8 verbatim buyer phrases with IDs. `/campaign-copywriting` draws its nouns and its pain wording from it:

- Copy may reuse the buyer's words in the offer sentence, the P.S., and Email 2's objection job. It never attributes a quote to the prospect, never presents a public quote as the prospect's own, and never invents a statistic.
- Every pain, objection or workaround line in copy traces to a cluster, or is rewritten as a genuine question the reader can answer either way. That escape never licenses what the copy kill-list bans: no question-form pain opener, no loaded hypothetical, no unverified problem assumption ("Still losing money to X?"). With no cluster behind it and no honest either-way question, the line is cut.
- A `model_hypothesis` never reaches copy as a fact.

## 14. The market feedback loop

`/market-evidence feedback` turns campaign results into evidence. It runs from `/cold-email-weekly-rhythm` at each arm read and at least every two weeks while a wave is live. It has nothing to read before launch: it starts once the stack contract's sending-platform slot is `live` and a wave has sent.

**Every human reply** (out-of-office and automated replies are skipped) becomes a ledger row: `evidence_type: outbound_reply`, `source_class: outbound_reply`, tier strong, `source_thread` = `<sending_platform>:<campaign_id>:<lead_id>` (the tool named in `run_state.sending_platform`), `source_author` = the role, never the name. It is tagged with:

| Tag | Values |
|---|---|
| `reply_label` | The existing reply-scoring label (`reply-scoring-core.md`), kept as is |
| `objection` | `price`, `timing`, `trust`, `already_have`, `not_priority`, `authority`, `risk_or_compliance`, `confusion`, or blank |
| `competitor_mentioned` | The named product or provider |
| `trigger` / timing reason | Why now, or why not now |
| `desired_outcome` | What they said they want |
| `unexpected_use_case` | A use the offer was not built for (in `notes`) |
| question asked | The question itself (in `notes`) |

Call notes and meeting outcomes the client shares become `sales_call` or `interview` rows.

**Then the loop closes:** the clusters are re-synthesized (counts change, new objection clusters appear, contradicted clusters are flagged); `lead-magnets.md` and the arms gain evidence lines; and a dated entry goes into the **Market feedback log** in `pain-clusters.md`: what the market said, what changed in the research, and what the next offer, magnet, segment or message should test. Recommendations route to the owning skill (`/offer-intelligence` validation, `/lead-magnet-brainstorm`, `/campaign-strategy`, `/icp-onboarding`); the loop never edits a live campaign and never moves the offer-validation flip, which `/cold-email-weekly-rhythm` owns.

## 15. The research index in `client-profile.yaml`

The `research_artifacts:` block is the standard index. `/market-evidence` keeps it current:

```yaml
research_artifacts:
  method: <how the last pass ran: primary provenance (claude-deep-research or claude-subagent-fanout), sub-agents, read routes used (WebSearch, WebFetch, browser pane, operator pastes)>
  stage: none | collected | synthesized | qa_pass | qa_deepen | qa_hold
  qa_verdict: PASS | DEEPEN | HOLD
  qa_date: YYYY-MM-DD
  last_refreshed: YYYY-MM-DD
  last_feedback: YYYY-MM-DD            # the last /market-evidence feedback run, or null before launch
  evidence_rows: <n>
  clusters: <n>
  top_clusters: [C-01, C-03]
  files:
    - profiles/<slug>/_research/evidence.csv
    - profiles/<slug>/_research/pain-clusters.md
    - profiles/<slug>/_research/competitors-and-ads.md
    - profiles/<slug>/_research/market-sample.md
  legacy_files: []                    # older research read at Step 0, never moved
  coverage_gaps_stated_honestly: []   # unread platforms, each with why and its paste reading list
  verified_by_orchestrator_directly: []
```

`run_state.status.research_stage` mirrors `stage`, so `/cold-email-kickoff` and `/continue-client` can resume at the right step. The primary provenance (`claude-deep-research`, or `claude-subagent-fanout` when the fallback ran) is also what goes in `run_state.ai_research_provider`; `run_state.research_routing` keeps its one valid value, `claude_deep_research`.

## 16. Model use for research work

Claude Code's own model tiers only (the Agent tool's `model` setting), with no helper and no API call. Small-tier sub-agents (`haiku`) do the mechanical work: extracting rows, tagging replies, and the Q5 quote spot-check. Mid-tier sub-agents (`sonnet`) do the judgment work that is too big for one pass: clustering large ledgers and building competitor cards. The session does the synthesis: it merges clusters, scores, runs the QA verdict and writes offers. `/ai-model-routing` holds the full routing.
