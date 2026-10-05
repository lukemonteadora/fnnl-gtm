# The Cold-Reader Panel: can a stranger tell what this email is?

**What this is.** An optional check that reads each cold email the way a real prospect would, before it is uploaded, and flags the ones a stranger cannot understand. Every other rail tests rules: truth, spam words, format, compliance and the frame check. None of them asks whether the reader can say who is writing, what is offered and why. Frame conformance can even lock in an email nobody understands. This check closes that gap. It returns findings only. It never writes or suggests copy: a failing email goes back to a fresh `/ask-aaron` call, and Aaron rewrites it.

**What it is not.** Proof that an email will win replies. Model readers are more patient than real founders, so the panel is a floor for confusion, not a forecast. Real reply data still decides which copy wins.

**How it runs in FNNL.** The readers and the judge are fresh Claude Code sub-agents (the no-AI-API rule). `outbound/scripts/cold_reader_panel.py` makes no model call and holds no key: it prepares one packet per reading, then scores what the sub-agents wrote back, the same split as `outbound/evals/run_eval.mjs`. The reader instruction is `outbound/evals/cold-reader/prompt.md`, benchmarked in `outbound/evals/BENCHMARKS.md` ("cold-reader"). Readers stay on `sonnet` until the 20-row agreement check on live FNNL copy and a 3-repeat run pass.

## When it runs

**Optional under the Aaron flow (see `aaron-flow.md` section 9).** The panel runs only when the operator asks for it on a run. When it does not run, nothing is held for it, the upload does not wait on it, the Aaron call is not told about it, and no word ceiling applies (Aaron-lane copy has no word cap; its length follows the frame's sentence count).

When the operator asks, it runs:
1. in Phase 4, after the copy is recorded and the other rails pass, before the paused drafts are built in the sending platform;
2. again on each Aaron rewrite it triggers (below);
3. on live copy first, when the operator asks for a rewrite of copy that is already sending, so the before and after use the same readers and the same tier.

## The config

One config per campaign, at `outbound/profiles/<slug>/campaigns/<campaign>/cold-reader.yaml` (gitignored with the rest of `profiles/`). Paths inside it resolve from the config's own folder, and runs land in `cold-reader/<label>/` beside it.

```yaml
slug: <campaign slug>
copy: variants.yaml                 # the file /campaign-copywriting writes (sequences > step > variants)
thread_from: live-variants.yaml     # only when follow-ups replace live copy: the Email 1 prospects actually got
leads: leads.verified.csv
personas: 6                         # 5 to 8 rows, one per company
seed: 7
sender:
  name: <sender first name, as the From line shows it>
  signature: "<the signature exactly as the platform adds it>"
awareness: {category: low, brand: low}
context_budget: 1                   # plain sentences about the sender allowed: a warning, never a fail
word_ceiling: 100                   # applies only when the panel runs
intended:                           # the answer key, from the locked offer and the website profile, never from the email
  who: "<who the sender is and what their company does>"
  offer: "<exactly what the reader gets>"
  why: "<why the sender offers it: what is in it for them>"
```

**The awareness note.** `/campaign-strategy` sets it per campaign so Aaron writes for the reader he actually has: `category` (does this reader know the kind of product: `low`, `medium`, `high`), `brand` (do they know the sender's company), `context_budget` (0, 1 or 2 sentences about the sender) and `word_ceiling`. With no note, the defaults are `low`, `low`, `1` and `100`, and the report says so. The rewrite loop can never raise the ceiling, so it cannot inflate emails.

## How it reads

- **Personas are real contact rows** from the campaign's own verified leads, one per company, spread across seniority and size, with a fixed seed so reruns compare. A reader gets the row's title, company, size, industry, what the company sells and who it sells to, plus the awareness level. It never gets a name or an email address.
- **Blind and independent.** Each (email, reader, repeat) is one fresh sub-agent that sees only the email, the sender's first name and the signature. Readers never see each other's answers, the offer or the intended meaning, and never look the sender up.
- **Follow-ups are read in their thread**, as a reply quoted under the Email 1 the prospect actually received, and once more on their own.
- **Spintax and variables.** The first spintax branch is read, `{{first_name}}` becomes a neutral name, and any other variable is filled from the persona's own row.

Each reader answers in fixed fields: who is writing, what is offered and why, what they would still want to know, the words they would not know, what they would fear if they said yes, and their reaction (`yes`, `who_are_you`, `no`, `ignore`). A separate judge sub-agent per email compares every reading with the intended meaning (`match`, `partial`, `wrong`, `cannot_tell`), sorts each open question into `delivery` (a reply to a yes would answer it) or `basic` (the email should have), and counts the sentences about the sender.

## How it scores

It never uses a model's self-rating. **Every fail rule is a share of readings**, so more repeats never mean more chances to fail. An email fails on any of these:

| Finding | Fails when | What it means |
|---|---|---|
| `too_little` | 15% or more of the readings could not say, or got wrong, who, the offer or why | The reader cannot tell. |
| `too_much` | more than half the readings have no question left that a reply to a yes would answer | The email answered everything, so there is no reason to reply. |
| `jargon` | a term is unknown to 30% or more of the readings (the sender's own name does not count) | The fix is a plain word, not a definition. |
| `who_are_you` | half or more of the readings react "who are you?" | The reader cannot place the sender. |
| `over_ceiling` | the body runs over the word ceiling | Checked in code, not by a model. |

It warns, without failing, when the judge counts more sentences about the sender than the context budget allows. The report also lists the basic questions left open, the delivery questions, the readers' fears, and any sender fact a reader used that the email does not state: inputs for Aaron, not fails.

## The rewrite loop (Aaron rewrites, the panel only reports)

1. **All the failing emails of a run go into one fresh `/ask-aaron` sub-agent**, never one call per email. It gets each email, what the readers could not say, the intended meaning, the awareness note and the ceiling. It never gets a suggested rewrite, and no house logic or cheaper tier rewrites his copy.
2. His rewrites run the other rails again (truth, spam words, format, the frame check), then the panel.
3. **At most 2 rounds.** Round 2 takes only the emails that still fail. An email that still fails is held on its own; everything else keeps moving, and the operator sees the last version at checkpoint B.

## Running it

```bash
python outbound/scripts/cold_reader_panel.py prepare --config <cold-reader.yaml> --label first [--repeats 2] [--tier sonnet] [--dry-run]
# the session launches one sub-agent per packet listed in cold-reader/first/plan.json, in batches, each writing its own answer file
python outbound/scripts/cold_reader_panel.py judge --config <cold-reader.yaml> --label first
# the session launches one judge sub-agent per packet in cold-reader/first/judge-plan.json, same tier as the readers
python outbound/scripts/cold_reader_panel.py score --config <cold-reader.yaml> --label first
```

`--dry-run` prints one reader packet and writes nothing. A rerun skips readings already on disk and valid, so a stopped run resumes. If a sub-agent cannot run (a usage limit, the tier unavailable), stop and tell the operator: never finish the remaining readers on a different tier and call it the same run.

## Caveats

- Model readers are more patient than real founders and read every word. Passing is a floor, not proof. Reply data decides.
- Personas come from the list, but a model plays them. A reader in a narrow field may know less, or more, than the real person.
- The judge is a model too and can be wrong at the edges; the report keeps its notes so a person can check a borderline call.
- Results wobble between runs, so a before and after uses the same config, the same tier and at least 2 repeats.
- The readers are Claude, the same family that writes the copy, so they may share its blind spots. That is a known limit of the no-AI-API rule, stated rather than hidden.
