# AI Ark people discovery, refined on a 200-row sample (operator 2026-10-05)

**What this is.** The one way FNNL finds the people a campaign emails: an AI Ark advanced people search per vertical, tested on a 200-row sample and tightened with include and exclude keywords before anything runs at scale. It is part of the Aaron flow (`aaron-flow.md` section 6). `/tam-build` runs it; `/list-building-orchestrator` and `/phase-3-list` route to it.

**Why this way.** A people search that carries the company filters and the title stack returns the buyers and their companies in one pass, with the company text (description, keywords, industries) the fit check needs. A first search idea is always a little wrong: it lets in companies that sell to the buyers, adjacent trades, and look-alike names. Two hundred rows scored by fit show which words the right companies share and which words the wrong ones share. Those words go back into the search as include and exclude keywords, so the scaled pull starts cleaner and less money is spent on wrong companies.

**What it replaces.** The old company-first route (AI Ark `company_search`, then a per-company people search on the survivors) and any parallel people search across tools. GetLeads and Prospeo are not people-discovery rungs any more. GetLeads `count_contacts` stays the size cross-check (0 credits on FNNL's paid GetLeads plan), and the company widening top-up stays for a thin universe (the companies it adds still get their people from AI Ark, by company domain).

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

**Never use People Export (`/v1/people/export`) or the MCP tool named `email_finder`** (which is People Export): it bills 0.5 credits per person even when no email is found. The AI Ark MCP `people_search` tool has no keyword exclude, so every refined search runs through REST with `outbound/scripts/aiark_people.mjs`.

**Status: documented, not yet proven live in FNNL.** The paths and prices above come from AI Ark's published CLI source. The first real run records the result here and in `provider-routing.yaml` (`email_finder_path_verified`).

## The request body

The script reads a search file (`outbound/profiles/<slug>/discovery/<vertical>/search.json`) that holds the body without `page` and `size`. Shape, with the parts this flow uses:

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

## The loop, per vertical

Run it for each vertical (segment) the offer targets. Steps 1 to 7 cost about 150 to 250 credits per vertical. Nothing in them reveals an email.

1. **Write the first search idea** with every filter: geography, headcount band, the industries, the include keywords, the technologies or growth signals the offer needs (free filters only), the title stack and seniority, and the standing excludes (step 0 below).
   `node outbound/scripts/aiark_people.mjs count --search <search.json>` reads the total (one 1-result call, 0.5 credits). A total over about 500,000 or under about 2,000 means the idea is too loose or too tight: fix it before sampling.
2. **Pull exactly 200 people:** `aiark_people.mjs sample --search <search.json> --n 200 --out sample-r0.jsonl` (two pages of 100, 100 credits). Every returned person id is saved to `seen-ids.txt`.
3. **Roll the people up to companies** (one row per `company_domain`; the script writes `sample-r0-companies.csv` with the name, domain, description, keywords, industries, headcount and location AI Ark returned).
4. **Score company fit** with batched Claude sub-agents (`sonnet`, 100 to 150 companies per agent, one file in and one file out each, merged by domain with a count check), against the client's ICP, `icp.disqualifiers` and `icp.supplier_exclusions`. Verdicts: `good`, `maybe`, `bad`, each with a one-line reason. The fit rate is `good / (good + maybe + bad)`, with `maybe` reported beside it.
5. **Mine the words:** `python outbound/scripts/keyword_mine.py --companies sample-r0-companies.csv --verdicts fit-r0.csv --out candidates-r0.csv`. For every AI Ark keyword tag, industry and one-to-three-word description phrase (with each company's own name, domain and city words removed), it counts how many good companies and how many bad companies carry it, balanced for the size of each group:
   - an **include candidate** is carried by at least 3 good companies, and at least 90% of its weight sits on the good side;
   - an **exclude candidate** is carried by at least 3 bad companies (or 1% of them, if more), and at least 90% of its weight sits on the bad side.
   `maybe` companies count on neither side.
6. **Claude reviews the candidates** (the session, or one sub-agent): keep a phrase only when it names what the company is or sells, not a coincidence of the sample (a city, a common word, a one-off product). An exclude that could describe a real buyer is dropped. Industries can be added to `industries.exclude` the same way.
7. **Write the refined search** (`search-r1.json`): the kept includes added to `keyword.any.include`, the kept excludes to `keyword.any.exclude` (`WORD` mode), the kept industries to `industries.any.exclude`. Read the new count. **Audit any exclude that cuts more than about 5% of the total:** count with and without it, pull a 20-row sample of what it removes (`aiark_people.mjs sample --search <search with only that phrase as an include> --n 20`), score it, and keep the exclude only when at least 90% of the rows are bad.
8. **Validate:** create a suppression list of the people already seen (`aiark_people.mjs exclude-list --ids seen-ids.txt`, free, lasts 24 hours) and pull a fresh 100 from the refined search. Score only the companies not already judged; reuse the verdicts for the rest. Target: **80% or more good-plus-maybe**, and a higher good rate than round 0.
   - Passed: the refined search goes to scale.
   - Not passed: one more round (steps 5 to 8 on all scored companies so far). **At most two refine rounds.** After that the search goes to scale as it is, with its measured fit rate stated at checkpoint A, because the company fit pass after the pull still drops the bad rows.
9. **Record it** in `outbound/profiles/<slug>/discovery/<vertical>/refine-log.md`: each round's total, fit rate, the phrases added and why, any exclude that failed its audit, and the credits spent (the balance before and after, from the free credits call).

The refined searches, their counts and fit rates are shown at checkpoint A (the targeting preview). Edge cases the sample surfaced and no ruling answers go into the same batch.

### Step 0: the standing excludes on every search (ruling `discovery-exclusions`)

Every search carries these from the first idea on, so they never cost a credit:
- the client's own domain, its current clients' domains, its named competitors (`icp.competitors`) and `icp.supplier_exclusions` (in `account.domain.any.exclude`);
- the suppression list's company domains (up to the size AI Ark accepts in one filter; the rest are dropped after the pull);
- the exclude keywords and irrelevant industries already ruled for this client (`account.discovery_exclusions` in the targeting spec).

Anything a call cannot carry is applied after the pull on the returned company fields, so it is still never revealed or emailed.

## At scale

1. **Slice the refined search** so no slice passes the 10,000-result cap. `aiark_people.mjs plan --search search-final.json --max 9500 --out plan.json` counts the search and splits it **by headcount band only** (it bisects `account.employeeSize`; each count is one 0.5-credit call). A slice still over the cap after that is flagged, never dropped: narrow it by hand by company country or state, then by industry (copy the search file, add the one filter, and run `plan` on the copy). Each slice is its own search file (`search-final-<slice>.json`), and the slices must not overlap (split one field into disjoint values, never stack two overlapping filters), so no person is pulled or paid for twice.
2. **Dry run first.** For each slice, `aiark_people.mjs pull --search <slice>.json --out <slice>.jsonl --dry-run` prints the slice's total people and its credit estimate (0.5 per person). Add the slices up; the total goes through `/api-cost-governance` against the $100 standing budget. A real pull refuses to run without `--max-credits` and stops before a page that would cross it.
3. **Pull** each slice with `--resume` and `--max-credits`: one JSONL file per slice, each with its own progress file, so a stopped pull carries on from its last page. Exit code 3 means AI Ark is out of credits or down: the tool-balance stop applies (stop and ask; never switch tools).
4. **Roll up and fit.** The people roll up into the company file. Company fit runs per `aaron-flow.md` section 12 (`volume`: batched Claude sub-agents on the AI Ark text; when the validation sample passed at 90% or more, the include and exclude keywords decide the clear rows and Claude judges only the rest). Good and maybe ship.
5. **People at shipped companies only** go to title classification (`title_classify.py`, then batched Claude sub-agents on distinct leftover titles) and then the email waterfall.

## The email waterfall after discovery

Rung 0 is the reservoir (`aaron-flow.md` section 7), then the contract order, unchanged: AI Ark, then Prospeo on what AI Ark left blank, then MillionVerifier on every email, walking each person's candidates in rank order and stopping at the first `ok`. The AI Ark rung reads one person at a time by id (`/v1/people/export/single`, 1 credit only on a found email), because only the people at shipped companies should be paid for, and a search page's `trackId` covers everyone on the page.

## Guardrails

- **Never print or log the key.** The script reads `AI_ARK_API_KEY` from `outbound/scripts/.env` and scrubs it from every error.
- **The response field names are not yet checked live.** The script reads each person's company domain, name, description, keywords, industries, headcount and location from the field names in AI Ark's own CLI source, trying the likely alternatives. On the first live sample of a new client, open `sample-r0-companies.csv` before scoring: if most rows have a blank domain, keywords or description, a field name has moved, so fix the script before spending more credits.
- **Samples and pulls live in the gitignored `profiles/` tree.** Nothing from them goes into a skill, a reference doc or a commit.
- **The keyword lists are per client.** A phrase that worked for one client is never copied into another's search without passing that client's own sample.
- **The biggest risk is an exclude that cuts real buyers** (a word the bad sample happened to share). The 90% one-sided bar, the minimum of 3 companies, the human-readable review in step 6 and the audit of any big exclude in step 7 are there for that. When in doubt, leave the word out: company fit still drops bad rows after the pull, but a buyer cut by an exclude is never seen again.
