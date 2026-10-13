# List discovery: an AI Ark company sample and keyword mining, then GetLeads (operator directive 2026-10-06)

**What this is.** The one way FNNL builds a campaign's list, the house order the operator set on 2026-10-06 (ruling `discovery-flow` in `standing-rulings.md`):
1. **Company sample and keyword mining in AI Ark.** An AI Ark company search per vertical on a sample of 200 to 300 companies, fit scored, and every keyword and industry the good-fit companies share mined as an include and every one the bad-fit companies share as an exclude. The output is the refined search.
2. **Full company export in GetLeads** on the refined search. AI Ark may run the same export in parallel, deduped by company domain, only if its export is fast.
3. **People in GetLeads:** the offer's title stack at the exported companies that pass company fit. AI Ark in parallel, deduped by person, only if fast.
4. **The email waterfall:** GetLeads, Giggal, AI Ark, Giggal, Prospeo, Giggal.

It is part of the Aaron flow (`aaron-flow.md` section 6). `/tam-build` runs it; `/list-building-orchestrator` and `/phase-3-list` route to it. The file keeps its old name so every link to it still works.

**Why this way.** A first search idea is always a little wrong: it lets in companies that sell to the buyers, adjacent trades, and look-alike names. A few hundred companies scored by fit show which keywords the right companies share and which the wrong ones share. Those keywords go back into the search as includes and excludes, so the full export starts cleaner. The operator's reason for running the export, the people and the first email rung in GetLeads is speed.

**What it replaces.** The 2026-10-05 AI-Ark-only people search (ruling `people-discovery`, now superseded) and the 2026-09-28 AI Ark people-first order. GetLeads `count_contacts` stays the exact size check (0 credits on FNNL's paid GetLeads plan).

## The tool and its costs (from AI Ark's own CLI source and docs, 2026-10-05)

| Call | Path (REST, `X-TOKEN` header) | Cost |
|---|---|---|
| People search | `POST /api/developer-portal/v1/people` | 0.5 credits per result returned |
| People preview (the total count only) | `POST /api/developer-portal/v1/people/preview` | 1 credit per page, any size |
| One person with a verified email | `POST /api/developer-portal/v1/people/export/single` (`{"id": "<person id>"}` or `{"url": "<LinkedIn URL>"}`) | 1 credit when an email is found, 0 otherwise |
| Find emails for a whole search page | `POST /api/developer-portal/v1/people/email-finder` (`{"trackId", "webhook"}`) | 1 credit per found email, 0 on a miss |
| Suppression list | `POST /api/developer-portal/v1/lists` (`{"type": "people_id", "values": [...]}`) | free; up to 10,000 ids; expires after 24 hours |
| Credit balance | `GET /api/developer-portal/v1/payments/credits` | free |

Limits: page size 1 to 100, about 5 requests a second, and a search pages through at most 10,000 results. A search's `trackId` is single-use and lasts 6 hours.

**Never use People Export (`/v1/people/export`) or the MCP tool named `email_finder`** (which is People Export): it bills 0.5 credits per person even when no email is found. The AI Ark MCP `people_search` tool has no keyword exclude, so the optional parallel people search runs through REST with `outbound/scripts/aiark_people.mjs`. The company sample runs on the AI Ark company search (the MCP `company_search` tool, 100 per page, 0-based pages); read its credit cost from the free balance call before and after the first sample.

**Status.** The paths and prices above come from AI Ark's published CLI source. The per-person email route was verified live on 2026-10-06 (`provider-routing.yaml` `email_finder_path_verified`).

## The request body (AI Ark)

The company sample uses the `account` part of this shape; the optional parallel people search uses all of it. The script reads a search file (`outbound/profiles/<slug>/discovery/<vertical>/search.json`) that holds the body without `page` and `size`. Shape, with the parts this flow uses:

```json
{
  "account": {
    "location":     {"any": {"include": ["United States"]}},
    "employeeSize": {"type": "RANGE", "range": [{"start": 11, "end": 200}]},
    "industries":   {"any": {"include": {"mode": "SMART", "content": ["<exact catalog value>"]},
                             "exclude": {"mode": "SMART", "content": ["<exact catalog value>"]}}},
    "keyword":      {"any": {"include": {"sources": [{"mode": "SMART", "source": "KEYWORD"},
                                                      {"mode": "SMART", "source": "DESCRIPTION"}],
                                         "content": ["<phrase>"]},
                             "exclude": {"sources": [{"mode": "WORD", "source": "KEYWORD"},
                                                      {"mode": "WORD", "source": "DESCRIPTION"},
                                                      {"mode": "WORD", "source": "NAME"}],
                                         "content": ["<phrase>"]}}},
    "technologies": {"any": {"include": {"mode": "SMART", "content": ["<exact catalog value>"]}}},
    "domain":       {"any": {"exclude": ["<client and competitor domains>"]}}
  },
  "contact": {
    "experience": {"latest": {"title": {"any": {"include": {"mode": "SMART", "content": ["owner", "founder"]},
                                                 "exclude": {"mode": "WORD", "content": ["assistant", "intern"]}}}}},
    "seniority":  {"any": {"include": ["owner", "founder", "c_suite"]}},
    "location":   {"any": {"include": ["United States"]}}
  },
  "lists": {"people_id": {"exclude": ["<list uuid>"]}}
}
```

- **Resolve every enum first** (industries, locations, technologies) with the free AI Ark lookup tools. A guessed value silently returns the wrong people.
- **Keyword sources:** `NAME`, `KEYWORD` (AI Ark's own company tags), `SEO`, `DESCRIPTION`, `INDUSTRY`. **Modes:** `SMART` (fuzzy, finds related ideas; the default for includes), `WORD` (the words must appear; the default for excludes, so an exclude never cuts by a loose association), `STRICT` (exact).
- **Titles** use `experience.latest.title` (the person's main current role). The title stack comes from the offer's `title_stack`; seniority narrows it.
- **`any` means OR across the listed values.** Filters on different fields are ANDed.

## Step 1: the company sample and keyword mining, per vertical (AI Ark)

Run it for each vertical (segment) the offer targets. Nothing in it reveals an email. Its sole purpose is to find the include and exclude keywords common to the good-fit and the bad-fit companies.

1. **Write the first search idea** with every company filter: geography, headcount band, the industries, the include keywords, the technologies or growth signals the offer needs (free filters only), and the standing excludes (step 0 below). Resolve every enum first. Read the total from the company search's `totalElements`: a total in the hundreds of thousands, or under about 2,000, means the idea is too loose or too tight, so fix it before sampling.
2. **Pull 200 to 300 companies** from the AI Ark company search (two or three pages of 100). Write them to `outbound/profiles/<slug>/discovery/<vertical>/sample-r0-companies.csv` with the columns `keyword_mine.py` reads: `company_domain`, `company_name`, `description`, `keywords`, `industries` (pipe-joined catalog values) and `location`, plus headcount. No script writes this file from the company search yet (`aiark_people.mjs sample` rolls up a people sample instead); until one exists the session writes it from the search results.
3. **Score company fit** with batched Claude sub-agents (`sonnet`, 100 to 150 companies per agent, one file in and one file out each, merged by domain with a count check), against the client's ICP, `icp.disqualifiers` and `icp.supplier_exclusions`. Verdicts: `good`, `maybe`, `bad`, each with a one-line reason, in `fit-r0.csv`. The fit rate is `good / (good + maybe + bad)`, with `maybe` reported beside it.
4. **Mine the keywords (operator directives 2026-10-06 and 2026-10-12, see `standing-rulings.md` `discovery-flow` and `exclude-guard`):** `python outbound/scripts/keyword_mine.py --companies sample-r0-companies.csv --verdicts fit-r0.csv --out candidates-r0.csv --min-good 2 --min-bad 2 --min-bad-share 0 --weight-bar 0.5`. Those flags switch off the script's default 90% bar and minimum of 3, so it lists every phrase carried by at least 2 good or at least 2 bad companies. Its exclude guard (defaults `--exclude-max-good 1 --exclude-max-good-share 0.02`) marks an exclude that good-fit companies also carry as `flagged`, never `exclude`. Then apply the rule:
   - **include:** every AI Ark keyword tag and industry common to the good-fit companies (carried by 2 or more of them);
   - **exclude:** every keyword tag and industry common to the bad-fit companies (carried by 2 or more of them) that passes the cost check in 4b;
   - **drop only** a keyword common to both (carried by 2 or more good and 2 or more bad companies): it does not discriminate, so it is used on neither side;
   - `maybe` companies count on neither side.

   Use every include, and every exclude that passes 4b. There can be tens or hundreds; there is no count cap, no review round and no hand-pruning to a short list. The script's one-to-three-word description phrases stay in `candidates-r0.csv` for reference but are not keywords and are not added to the search (most are ordinary words such as "city" or "day", which as excludes would cut most of the market).
4b. **Cost every exclude before it is used (ruling `exclude-guard`, operator 2026-10-12).** On the 2026-10-12 fnnl-agency wave the mined excludes cut most of the good market: a tag rare in a 300-company sample can still sit on thousands of good companies. So:
   - read GetLeads `count_contacts` (0 credits) for the refined search with every include and no excludes (the base count), then once per exclude with only that exclude added, into `exclude-counts.csv` (`phrase,source,count_with`), then once with every exclude the next line keeps;
   - run `python outbound/scripts/exclude_cost.py --companies sample-r0-companies.csv --verdicts fit-r0.csv --candidates candidates-r0.csv --counts exclude-counts.csv --base-count <n> --all-excludes-count <n> --out exclude-cost.csv --final excludes-final.csv`.

   One exclude may remove at most 5% of the good sample companies, or 5% of the market count when good companies carry it. All kept excludes together may remove at most 10% of either. A flagged or over-cap exclude is dropped, never hand-kept. Exit 4 (the kept stack still costs over 10%) holds that vertical's export and goes to checkpoint A with `exclude-cost.csv`; it never runs silently.
5. **Write the refined search** (`search-final.json`): every include in `keyword.any.include`, every exclude in `excludes-final.csv` in `keyword.any.exclude` (`WORD` mode), the included industries in `industries.any.include` and the excluded ones in `industries.any.exclude`. Read the new count. This is the refined advanced-search criteria the GetLeads export runs on. There is no separate validation sample: company fit after the export still drops the bad rows.
6. **Record it** in `outbound/profiles/<slug>/discovery/<vertical>/refine-log.md`: the sample size, the fit rate, the include and exclude counts, the keywords dropped as common to both, the flagged and dropped excludes (`exclude-cost.csv`), the GetLeads count with and without the excludes, and the credits spent (the balance before and after, from the free credits call).

The refined searches, their counts and fit rates are shown at checkpoint A (the targeting preview). Edge cases the sample surfaced and no ruling answers go into the same batch.

### Step 0: the standing excludes on every search (ruling `discovery-exclusions`)

Every search (the AI Ark sample, the GetLeads export and people search, and any AI Ark parallel search) carries these from the first idea on, so they never cost a credit:
- the client's own domain, its current clients' domains, its named competitors (`icp.competitors`) and `icp.supplier_exclusions` (in AI Ark, `account.domain.any.exclude`);
- the suppression list's company domains (up to the size the tool accepts in one filter; the rest are dropped after the pull);
- the exclude keywords and irrelevant industries already ruled for this client (`account.discovery_exclusions` in the targeting spec).

Anything a call cannot carry is applied after the pull on the returned company fields, so it is still never revealed or emailed.

## Step 2: the full company export (GetLeads)

1. **Translate the refined search into GetLeads' own filters:** geography (`office_countries`), headcount (`employee_profiles_on_linkedin_min` and `_max`), and the industries and keywords. AI Ark's tags and industries are resolved to GetLeads' own values with `get_available_values`; that they map one to one is unverified, so a value with no GetLeads match is logged in `refine-log.md`. Whether one GetLeads call accepts hundreds of keywords is also unverified: if it does not, split the keywords across calls and merge, never trim the list.
2. **Count, then export.** `count_contacts` gives the exact size at 0 credits. The export (ruling `getleads-export`, confirmed once per client at checkpoint A) runs on the GetLeads plan credits FNNL already pays for, with no dollar cap (the tool-balance stop still applies; ruling `volume-first`), and is rolled up to one row per `company_domain`.
3. **AI Ark in parallel, only if fast.** AI Ark may run the same refined company search at the same time, deduped with GetLeads by `company_domain`, only when its company export is fast (judged from how the sample pages ran). If it is slow, skip it and log why. It is a parallel source, never a gap-fill rung.
4. **Company fit, once per `company_domain`, before any people spend.** It runs per `aaron-flow.md` section 12 (`volume`: batched Claude sub-agents on the company text the export returned). `good` and `maybe` ship; only `bad` drops (ruling `fit-ship-rule`).
5. **A missing attribute is held and re-read, never dropped (ruling `attribute-reread`, operator 2026-10-12).** When a campaign needs an attribute the export text does not state (for an agency, the client type it serves), the company stays `maybe` with the attribute blank. Those companies get the free site re-read: `python outbound/scripts/site_reread.py fetch` (homepage plus one industries or clients page, plain HTTP), `site_reread.py batch` (a few hundred sites per file), batched Claude sub-agents judging fit and the attribute against a per-client rules file (about 10 at once), then `site_reread.py merge`, which fails on a missing or duplicated domain. Aaron's ~40% attribute floor is measured after the merge. A site that cannot be read stays `maybe` with the attribute blank and is counted in the funnel.

## Step 3: people at the shipped companies (GetLeads)

1. **GetLeads finds the buyers:** the offer's full title stack at the `good` and `maybe` companies only (1 plan credit per record returned). Depth is Aaron's whole title stack by default (ruling `people-depth`, operator 2026-10-12): every person at the company with a title in the stack, never the first 1 to 3. `people_per_company` is written per campaign with its source (Aaron's call, the wave plan or a client rule) in `run_state` or the wave plan; a lower number needs that source. Under 1.5 people per fit company is a leak `funnel_gate.py` reports. Every person row must carry `linkedin_url`, because the first email rung looks people up by it.
2. **AI Ark in parallel, only if fast:** the same title stack through `aiark_people.mjs` with the shipped domains in `account.domain.any.include`, deduped with GetLeads by person (LinkedIn slug, then email). If it is slow, skip it. When it runs, keep each slice under AI Ark's 10,000-result cap: `aiark_people.mjs plan --search <search>.json --max 9500 --out plan.json` splits by headcount band (narrow a slice still over the cap by country or state, then industry, never overlapping), `pull --dry-run` gives the credit estimate for `/api-cost-governance`, and a real `pull` needs `--max-credits` and `--resume`. Exit code 3 is the tool-balance stop (stop and ask; never switch tools).
3. **Title classification:** `title_classify.py`, then batched Claude sub-agents on the distinct leftover titles.

## Step 4: the email waterfall

Rung 0 is the reservoir (`aaron-flow.md` section 7), a free cache in front of the waterfall. Then the contract order (operator directive 2026-10-06, see `standing-rulings.md` `discovery-flow`), each rung only on the people the earlier rungs did not close, planned by `list_waterfall.py`:
1. **GetLeads** by LinkedIn URL (`outbound/scripts/getleads_email_batch.mjs`), then **Giggal** (`outbound/scripts/giggal_verify.mjs`);
2. **AI Ark** one person at a time by id (`outbound/scripts/aiark_email_single.mjs`, `/v1/people/export/single`, 1 credit only on a found email), then Giggal;
3. **Prospeo** (`outbound/scripts/prospeo_email_batch.mjs`), then Giggal.

Only Giggal `deliverable` (gate `valid`) and `catch_all` are accepted. A `catch_all` ends that person's walk and ships labelled `catch_all`; unknown, invalid and unverified emails never ship.

## Guardrails

- **Never print or log the key.** The script reads `AI_ARK_API_KEY` from `outbound/scripts/.env` and scrubs it from every error.
- **The response field names were confirmed live on 2026-10-06 (PropFuel).** The live shape is `totalElements` and `content` at the top, with the company under `company.summary` (name, description, industry, `staff.total`), `link.domain`, `hashtags`, `industries`, `naics` and `location.headquarter`; the script reads those and still tries the older alternatives. Two live limits: `account.domain.any.exclude` takes at most 300 values (apply longer suppression lists after the pull), and the seen-people exclude goes through `lists.people_id.exclude`. On the first live sample of a new client, open `sample-r0-companies.csv` before scoring: if most rows have a blank domain, keywords or description, a field name has moved, so fix the script before spending more credits.
- **Samples and pulls live in the gitignored `profiles/` tree.** Nothing from them goes into a skill, a reference doc or a commit.
- **The keyword lists are per client.** A phrase that worked for one client is never copied into another's search without passing that client's own sample.
- **Every mined include is used; every exclude is guarded and costed first (operator directives 2026-10-06 and 2026-10-12, see `standing-rulings.md` `discovery-flow` and `exclude-guard`).** The old 90% one-sided bar, the minimum of 3 companies and the review round stay gone. A keyword common to both the good and the bad companies is used on neither side; an exclude that good-fit companies carry is flagged by `keyword_mine.py`; and `exclude_cost.py` drops any exclude over 5% of good-fit volume and holds the vertical when the kept excludes together cost over 10%. The counts with and without the excludes are recorded in `refine-log.md` and shown at checkpoint A.
- **The volume gate runs before upload (ruling `volume-gate`).** `funnel_gate.py` counts every stage (excludes, fit, people per company, emails found, verified, dedupe, QA) against the campaign's target and fails on a leak, so a shrinking list is caught where it shrank.
