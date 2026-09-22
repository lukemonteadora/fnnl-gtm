# List-Building Play Library: How to Derive a List, and How to Group a TAM

> **What this is.** The canonical reference for *how a list gets derived* and *how a TAM gets grouped into campaigns*. It is a study and design reference, not a skill. Resolve any skill reference to `list-building-play-library.md` here under `outbound/reference/`.
>
> **Scope boundary, so this is not a second source of truth.** `signal-strategy-playbook.md` owns **which signals exist**, what each one proves, its campaign slices, its copy angles, and its acquisition paths. This doc owns the layer underneath that: **the six shapes a list can be derived in**, and the rule for deciding **which groupings earn their own campaign, their own copy, or neither**. Where a play depends on a signal, the signal's detail lives in the playbook and is cross-linked, never restated. The volume shape of a wave is owned by `/campaign-strategy` (Volume-first, the ≥500-company floor, the Offer-Validation Wave); this doc quotes those rules and never sets its own.
>
> **Tool-status note (FNNL Agency).** Every play below is written as a **capability**, never a vendor. FNNL's tools are the closed list in the `approved_stack` block of `stack-contract.yaml` (operator directive 2026-09-22), and the live answer for any capability is the matching slot there. A slot at `not_chosen` or `held` declares nothing, and a tool outside the approved list needs explicit operator approval before any play uses it. Before running a play, read the matching slot and confirm the specific **field or filter** the play names actually exists in the chosen tool. A tool being named in any signal library is not evidence the filter exists; `chosen` is not `live`.

---

## The One Idea Underneath All of It

**The list is the personalization.**

This is the whole thesis, and it is the reason the grouping question matters more than the copywriting question. A signal's job is not to give you a clever first line. Its job is to make the list **homogeneous**, so that one piece of copy is genuinely relevant to every row in it. When the list is built correctly, the relevance is already in the targeting and the email does not have to manufacture it per contact.

This is encoded, not just believed. `/campaign-copywriting` Hard Rule 34 **retires per-contact signal copy**, and Hard Rule 38 allows a signal fact into the body only when it is **true of every contact in the slice**. So the sequence runs:

1. A signal defines who is in the list.
2. Because every row shares the signal, the shared fact can be stated flatly in the copy without a merge tag.
3. No per-row research, no observational opener, no "I noticed."

The practical consequence for list building: **a grouping is only worth making if it changes what you would say.** A cut that produces a different list but the same email is not a campaign. It is a tag.

---

## Part 1: The Six Shapes a List Can Be Derived In

Most operators only know shape 1 and shape 2. Shapes 3 through 6 are where the defensible lists come from, because they are harder for a competitor to reproduce.

### Shape 1: Direct filter

Set firmographic and contact filters on a database and export what comes back. Industry, headcount, geography, title, seniority, founded year, tech stack.

- **Capability needed:** a company-discovery source and a contact-discovery source.
- **Volume behavior:** unlimited. This is where the big campaigns come from.
- **Strength:** cheap, fast, repeatable, and the only shape that filters *before* you spend per record.
- **Weakness:** it describes **what a company is**, which rarely changes the message. Everyone with the same tool builds the same list. Treat it as the substrate that the other five shapes cut into, not as a strategy on its own.

### Shape 2: Seed and lookalike

Start from a set of companies you already know are the right buyer (your client's own case-study customers), then find their twins on the attributes that made them fit.

- **Capability needed:** a seed set (from `/social-proof-bank`), plus a company-discovery source that can match on the seed's defining attributes.
- **Volume behavior:** expands in a controlled ladder (more seeds, then markets, then headcount bands, then merging sibling groups), each step gated on fit holding. `/tam-build` owns the ladder.
- **Strength:** the proof and the list are built from the same evidence, so the case study you show is automatically the right one. This is the workspace **default** discovery motion.
- **Weakness:** saturates. A client with eight case studies in one niche will run out of twins, which is exactly what the expansion ladder exists to solve.

### Shape 3: The two-hop (relationship-derived)

**This is the shape most people never learn.** You do not search for your target directly. You search for a *different* entity that carries an observable signal, then follow a relationship from that entity to the company you actually want to email.

The structure is always: **find A, resolve A's relationship to B, target B.**

- **Capability needed:** a contact-discovery source that returns the **relationship field as a column on the exported row**, not merely as a search filter. This is the load-bearing requirement and the one most likely to kill the play late. For the departure variant below, that field is `previous_company`. A tool can have a job-change filter and still not hand you the previous employer, in which case the play is unbuildable in that tool.
- **Volume behavior:** one A usually yields one B, so the company count of the finished list equals the number of A's you found. Always do this arithmetic **before** building, against the ≥500-company floor.
- **Strength:** the resulting list is invisible to anyone filtering the normal way. Nobody else is emailing it.
- **Weakness:** two sources of decay stacked. The signal on A may be stale, and the relationship to B may have already resolved itself.

The four variants worth knowing:

| Variant | A (who you search) | B (who you email) | What it proves about B |
|---|---|---|---|
| **Departure backfill** | Someone who just left a company | Their **previous** employer | B has a hole where A used to be |
| **Arrival mandate** | Someone who just joined a company | Their **new** employer, or the person themselves | B is in a rebuild-and-audit window |
| **Alumni graph** | People who left your best customer | Wherever they landed | B is staffed by someone who already knows your category |
| **Competitive carry-over** | Someone who used a relevant tool at their old company | Their new employer | B lacks a capability A is used to having |

### Shape 4: Reverse directory (listed-as-a-customer)

The list is everyone who appears on **someone else's published list**. Case-study and logo pages, integration and marketplace directories, review-site profiles, conference exhibitor and sponsor lists, association membership registries, award shortlists, grant and permit registries.

- **Capability needed:** a web-crawling capability and a bulk-classification capability. No specialist database.
- **Volume behavior:** bounded by what the source actually published, which is usually dozens to a few hundred per source. **Scales by stacking many sources, not by going deeper into one.**
- **Strength:** membership on the list is itself a qualification. A company listed as a customer of an adjacent tool has already proved it buys this category.
- **Weakness:** almost always sub-floor on its own. Its best use is usually as a **seed set for shape 2** rather than as a campaign list.

### Shape 5: Artifact hunt (they published something)

The list is every company that produced a specific public artifact, and the artifact's *content* is the qualification. Job postings and their body text, ads, pricing-page changes, a specific script or technology on the site, published reports, regulatory filings.

- **Capability needed:** a web-search capability plus crawling, or a purpose-built endpoint for that artifact type. Classification to read the content.
- **Volume behavior:** generally high. Job postings in particular are the most abundant high-intent artifact in B2B.
- **Strength:** the artifact often states the pain in the buyer's own words, which means the copy writes itself from their vocabulary rather than yours.
- **Weakness:** the artifact may be published by someone other than your buyer (an agency, a job board, a contractor), so attribution needs a check.

### Shape 6: Exclusion-defined (they lack something)

The list is defined by the **absence** of a thing. No RevOps headcount despite a large sales team. No case studies on the site. Not running ads despite scale. No applicant-tracking system on the careers page. No dedicated recruiter despite fast growth.

- **Capability needed:** whatever detects the presence of the thing, inverted. Usually crawl plus classification, which makes this cheap.
- **Volume behavior:** typically very high, because absence is more common than presence.
- **Strength:** it defines the gap your offer fills, which is the closest a list can get to being a qualification. It is also the least competed shape, because most tooling is built to filter on presence.
- **Weakness:** absence of evidence is not evidence of absence. "No RevOps person on LinkedIn" may mean the title is different, not that the function is missing. Always pair with a second confirming signal before you assert the gap in copy.

---

## Part 2: Grouping the TAM, and the Verdict Every Group Must Get

A grouping is a proposal, not a campaign. Every proposed group has to be assigned one of four verdicts before it goes anywhere, because the governing shape of a wave is **volume-first, not campaign-count-first** (`/campaign-strategy`, HARD RULE). Cold email's volume lives in a few big campaigns, never in many small ones.

### The four verdicts

| Verdict | When it applies | What happens |
|---|---|---|
| **Standalone campaign** | ≥500 companies carry the grouping **and** it changes the message | Gets its own campaign and its own copy. These are the big ones, 1,000 to 20,000 leads each. |
| **Fold** | Under 500 companies, or it does not change the message | Merged into a qualifying campaign, or lookalike-expanded to ≥500 while fit holds, or held for a later wave. Never shipped small. |
| **Test allocation** | A genuinely new or unproven angle worth learning from | Runs as a bounded experiment at roughly 5 to 10 percent of wave volume. Winners scale **back into** the big campaigns. |
| **Tagged attribution bucket** | ≥500 companies, but the message is identical to a big campaign's | Rides the big campaign with a tag, so you can still read its performance. No separate campaign, no separate copy. |

Three rules that decide the verdict:

1. **The ≥500-company floor is a hard count, not a judgment.** It counts **companies**, not verified contacts. A slice with 800 companies qualifies even if it yields 390 verified contacts. A slice with 300 companies does not ship regardless of contact count.
2. **The message-differential test.** Would this group get a materially different pain, a different proof, and a different vocabulary? If the honest answer is no, it is a tag, not a campaign. This is the single most common mistake: building ten lists that all get the same email.
3. **Contact-level signals outrank company-level signals** at equal viability (`/campaign-strategy`, HARD RULE). A why-now about the *person* beats a state of the *company*. The strongest slices stack one of each.

### The grouping axes, ranked by how much they change the message

| Axis | Example | Does it change the message? |
|---|---|---|
| **Who they sell to** | Sells into law firms vs sells into restaurants | **Almost always.** The flagship message-differential split. |
| **Contact-level why-now** | Decision-maker in seat under 12 months | **Yes,** and it is the highest-intent axis. Usually sparse. |
| **Company-level why-now** | Hiring, funded, running ads, growing fast | **Usually,** because the timing implies a specific pain. |
| **Defined-by-absence** | No RevOps, no in-house recruiter | **Yes.** The gap is the message. |
| **Stage or cohort** | Founded 2021 to 2023 | **Sometimes.** Stage-specific pain is real but broad. |
| **Firmographic** | Industry, headcount, geography | **Rarely.** Usually a tag, not a campaign. |
| **Seniority alone** | VP vs Manager | **No.** A copy variable, not a campaign split. See Part 3. |

**Pull the whole buying committee inside a group, do not split on it.** `/campaign-strategy` requires scraping **every** ICP-matching decision-maker at **every** company in a qualifying set, because contacts-per-company is the biggest volume lever available. Seniority then shows up as a copy variable where it genuinely changes the pain, not as a reason to fragment the list.

---

## Part 3: One Offer or Many? The Three-Way Split

Most of the confusion here comes from one word doing three jobs. Separate them and the question mostly dissolves.

**1. The offer category.** The business you are in. "We help companies hire talent." This never varies by group. If two groups genuinely need different categories, that is not a segment, it is a second business line with its own ICP, its own proof, and its own pipeline.

**2. The offer.** The specific front-end thing, with a defined deliverable, a timeframe, and a risk reversal. "Five pre-vetted candidates for one open role, delivered in 72 hours, free, you only pay if you hire one." **Several offers per wave, each in its own randomized cell** (operator directive 2026-09-22, following Aaron's three-to-four-offer test portfolio, doctrine §5). The Offer-Validation Wave is the whole qualified TAM at full volume, with the offer test running inside it. First-wave offer count = `max(3, floor(qualified_contacts / 2000))`, where `qualified_contacts` is the wave's send-eligible contacts, capped at the number of qualifying candidates (fewer than 3 only when fewer qualify, and the report says so) (Aaron, Apr 6: about one front-end offer per 2,000 leads; May 4: always test three or four). Every first-wave segment's rows are split evenly into one cell per offer, all launched together with the same copy skeleton, so within a segment the offer is the only variable and the read is an offer x segment matrix. The desk-ranked primary gets no head start, and only arms beyond the count queue (`/campaign-strategy` validation arms; Aaron process alignment, operator directive 2026-09-22, supersedes sizing a validation list to the chosen offers). This used to read "one offer per client per wave".

**3. The copy variable.** Everything that changes by group: which pain you lead with, which proof you show, the vocabulary, and the concrete noun that gets slotted into the offer sentence (which role the shortlist is for, which vertical the case study is in).

The resolution, for groups that share the same buying problem: **groups vary the copy variable, not the offer.** A shortlist of five candidates is one offer whether the role is a controller or a warehouse supervisor. Which role it is, is a variable inside the offer. A group whose buying problem genuinely differs gets its own offer set instead (the ruling below, `offer.segments`, operator decision 2026-09-22).

### Why the offer is tested first, and why each offer gets its own cell

The four levers run in a fixed order of impact: **offer, then list, then personalization, then volume.** The order sets what is tested first, never how much is sent (Aaron process alignment, operator directive 2026-09-22; supersedes reading the order as a small first wave that holds volume back). The offer is the biggest lever, which is why `/campaign-strategy` makes the Offer-Validation Wave a HARD RULE for any client whose offer is not yet market-proven, and Aaron validates the offer *by* sending volume, so that wave is the whole qualified TAM at full volume with the offer test inside it (Sep 21: the whole mapped TAM of one vertical, about 96,000 sends in one week). What waits for a proven offer is the signal-slice fan-out, never the rest of the TAM.

Running several offers across several groups inside one undifferentiated campaign means that when it underperforms you cannot tell whether the offer was weak or the group was wrong, because both varied simultaneously, and you burn freshly warmed sending capacity and first-touch reputation to learn nothing. The fix is structure, not fewer offers: give each offer its own randomized cell on the same list, so any difference between cells is the offer. Validate the offers broadly first, on the biggest and cleanest lists, differentiated by **message** rather than by a sparse timing signal. Once one shows life, fan out.

### The strongest objection, and the ruling

**Objection:** if the client serves genuinely different buyer worlds, forcing one offer produces a lowest-common-denominator offer that is weak everywhere.

**Ruling: fixable, not fatal, and the fix is per-group offer sets, not one broadened offer (operator decision 2026-09-22).** A sharp offer to a narrower list beats a generic offer to a wider one, and it produces a readable result. So a group whose buying problem genuinely differs gets its own offer set from the research (`offer.segments` in `/lead-magnet-brainstorm`), and each group's offers are tested in their own cells, with the offer count from the first-wave formula run on that group's own qualified contacts. Every group launches: when sending capacity cannot carry every group's wave at the one-week pace, the runway stretches and the priority group goes first in send order, never a group held back or cut (Aaron process alignment, operator directive 2026-09-22; capacity is sized to the volume, never trimmed). Broadening one offer to cover every group is how you end up with an offer that validates nowhere.

### When a group genuinely earns its own offer

When the research shows a buying problem the current offer cannot address at all (a different pain, a different buyer, different proof), the group gets its own offer set from the start (operator decision 2026-09-22). A failed message split is no longer a precondition. For the record, the old rule needed both of these:

1. The group has a **buying problem the current offer cannot address at all**, not merely a different flavor of the same one.
2. A message split has already run and shows a **persistent reply-rate gap that copy changes cannot close.**

Those were the old preconditions. Now the group's own offer test launches alongside the others, each on its own cells; thin capacity stretches the runway and sets send order, never holds a group back (Aaron process alignment, operator directive 2026-09-22).

### Where the offer sequence actually sits

The offer comes first, and the list is built to fit it. The live order is:

**ICP and buyer pain, then the front-end offer set (a lead magnet is one of Aaron's three offer buckets, not a separate step), then data points, then the 5 to 10 companies that best fit the locked offer as seeds, then the lookalike TAM, then scoring, then the campaign and test design with its capacity request, then copy, then the reply machine before launch** (Aaron process alignment, operator directive 2026-09-22).

> **Superseded 2026-09-19.** This section used to read "ICP, then source-signal feasibility, then offer...", with a separate source-signal feasibility phase running before the offer. That phase is retired. There is no `/lead-source-strategy` Source-Signal Discovery Mode and no `source-signal-intelligence.md` any more. If you find a reference to either, it is stale.

Two reasons the old order was wrong. First, feasibility ran before anything existed to measure feasibility against, so the offer-fit judgement was a guess. Second, obtainability is now watched live: a small sample in the list-building workspace shows the actual fill rate per column, which beats a predicted coverage number written a week earlier.

The one real thing the old phase protected against, an offer that leans on a signal the stack cannot obtain, is now caught by the **Signal-Capability Check** at offer lock in `/lead-magnet-brainstorm`. It is a one-minute check, not a research phase, and it passes instantly for an offer that needs no signal at all, which is the preferred shape. `/data-point-discovery` then owns obtainability and the market source landscape, after the offer locks.

---

## Part 4: Worked Example, a Talent and Recruiting Offer

Offer category: helping companies hire. Worked here because it shows the two-hop clearly, and because the volume arithmetic differs sharply between plays that look equally clever on paper.

**The message-differential axis for this category is the role family being placed**, not the client's industry. Which function you hire for determines the buyer (a functional VP versus a talent leader), the pain, and the proof you show (placements in that same function). It is the direct analogue of the sold-to axis.

| # | Play | Shape | How the list is derived | Verdict on volume |
|---|---|---|---|---|
| 1 | **Departure backfill** | Two-hop | Find people who started a new role in the last 30 to 90 days in the target role family, read `previous_company` off the row, email the hiring owner there | **Standalone if the role family is common**, otherwise fold. Do the arithmetic: one mover equals one company. |
| 2 | **Stale requisition** | Artifact hunt | Job posts for the target role open 45+ days, or reposted at least once | **Standalone, and the volume anchor.** Job postings are abundant. |
| 3 | **Revolving-door seat** | Artifact hunt | The same role posted 2+ times in 12 months | **Standalone if ≥500**, else fold. Note it changes the message from speed to quality of hire, so it earns its own copy when it qualifies. |
| 4 | **Growth without recruiting capacity** | Exclusion-defined | Headcount growth 25%+ **and** zero or one in-house recruiter | **Standalone.** High volume, and the gap is the message. |
| 5 | **Already buys the category** | Reverse directory / artifact hunt | Posts syndicated through staffing boards, or agency language in the listing | **Standalone if ≥500.** Highest conviction of the set: no need to sell the concept, only the switch. |
| 6 | **New talent leader in seat** | Two-hop (arrival) | Head of Talent or HR lead in role under 6 months | **Test allocation.** Contact-level signal, so it ranks above company-level slices at equal viability, but check company span against the floor. |
| 7 | **Post-funding hiring mandate** | Direct filter | Funding in last 90 days plus a spike in open roles | **Test allocation or tagged bucket.** Funding is sparse in any 90-day window unless geography is wide. |
| 8 | **Recruiter left, not replaced** | Two-hop (departure) | The in-house recruiter departed and the seat is unfilled | **Fold.** One narrow title per company puts this structurally under the floor. |
| 9 | **Fast washout** | Two-hop (departure) | Someone who left a role after under 6 months | **Fold or test allocation.** Sparse, but a strong angle when it qualifies. |
| 10 | **Competitor's published clients** | Reverse directory | Companies named on a competing agency's case-study page | **Seeds, not a campaign.** Feed these into shape 2 rather than emailing the handful directly. |

### Play 1 in full, since it is the one that needs the most care

**Build:**
1. Search contacts by the **role family the client places**, filtered to a recent job change or a current-role tenure under one to three months.
2. Confirm the export actually carries **`previous_company` as a column**. If it does not, the play stops here regardless of how good the filter was.
3. Deduplicate by `previous_company`. Several movers can come from the same employer, and that company is one row in your list, not three.
4. Count distinct previous employers against the **≥500-company floor** before spending anything further.
5. Find the hiring owner at each previous employer: the departed person's functional leader, plus the talent or HR lead. Pull the whole committee.

**Sharpen it into a two-signal list.** Cross-check each `previous_company` against an **open job posting for the same role** (play 2). A confirmed match converts an inference ("they probably have a hole") into a stated fact ("the seat is open"), which is the difference between a guess and a campaign. Only the confirmed subset earns copy that asserts the opening.

**Failure modes, all real:**
- **Data lag.** Profile updates trail the actual move, so a "30 days ago" mover may have left four months ago.
- **The seat may not exist any more.** Attrition during a layoff is not a backfill. An unconfirmed list will contain these.
- **It may already be filled.** The longer the lag, the higher this share.
- **The ex-employer may be defensive.** They are, in a sense, the party that failed to keep this person. Lead with the open seat and its cost, never with the departure as a diagnosis of them.
- **Reachability.** The departed person's manager is not always identifiable, which is part of why you pull the talent lead as well.

---

## Part 5: The Checklist

Before any grouping becomes a campaign:

- [ ] **Counted, not estimated.** ≥500 companies carry the grouping, measured on enriched rows.
- [ ] **The column is populated.** The predicate runs on a real, verified-populated column, never an assumed one.
- [ ] **The capability is confirmed live.** The specific field or filter the play depends on exists in the tool that fills that slot in `stack-contract.yaml`, and the slot is `live`, not `chosen`.
- [ ] **It passes the message-differential test.** A different pain, a different proof, a different vocabulary. If not, it is a tag.
- [ ] **The whole committee is pulled.** Every ICP-matching decision-maker at every company, never one or two per company.
- [ ] **One offer.** The group varies the copy variable, not the offer.
- [ ] **A verdict is assigned.** Standalone, fold, test allocation, or tagged bucket. Never "ship it small and see."
- [ ] **The wave shape holds.** A few big campaigns carry the bulk of the sends, with roughly 5 to 10 percent in bounded tests. A big TAM fragmented into many small campaigns is a process miss.

---

## Related

- `signal-strategy-playbook.md` for which signals exist, what each proves, and how to acquire it
- `/campaign-strategy` for the volume-first wave shape, the ≥500-company floor (applied per offer cell), and the Offer-Validation Wave (the whole qualified TAM at full volume, the offers as equal cells inside it)
- `/tam-build` for case-study-anchored discovery and the lookalike expansion ladder
- `/data-point-discovery` for deciding which data points to collect before any list is built
- `/social-proof-bank` for seed sets and the per-group proof that copy draws on
- `/campaign-copywriting` for Hard Rules 34 and 38, which govern how a signal may appear in copy
