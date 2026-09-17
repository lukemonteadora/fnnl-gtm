# Social Proof Bank: client-fill Google Sheet template + outreach messages

Read by `/social-proof-bank` (and `/proof-asset-request` bank mode) when **self-gather comes up short**: we could not find a real proof point ourselves, or a planned campaign needs a case study we don't have on file. This holds the client-facing **Google Sheet** we send the client to fill, with worked examples built in as a guide, plus the ready email / Slack message that explains what it is, why it matters, and how to fill it.

**Industry-agnostic by design.** Every column and every example below works for any client in any industry. The example rows deliberately span SaaS, manufacturing, healthcare, local services, ecommerce, and professional services so the client sees the shape no matter what they sell. Never re-shape the sheet to one vertical; `service_line` just means "whatever this client sells" (a plan, a product family, a procedure, a job type, a practice area).

**Raw facts only, never copy.** The sheet asks the client for the real facts we can't find (the customer, the result, the number, the timeframe, permission to name). We turn those into the one-liner and the poke-the-bear question ourselves. If a field on this sheet asks the client to phrase anything for an email, it is wrong.

---

## When to use it

- `/social-proof-bank` finished self-gathering (intake proof block, onboarding-call notes, offer-intelligence, the client's own website/case-study pages, voicenotes) and one or more segment x service-line rows still have **no real proof** (`proof_status = gap_block` or `gap_flag`).
- Or a specific campaign needs a named client / case study / number that isn't on file, and we've exhausted what we can find.

Send ONE sheet per bank build (top up the gaps), not one per campaign. Pre-fill everything already found so the client is confirming and completing, not starting blank.

---

## The Google Sheet: structure

Three tabs. Tab 1 tells the client what to do (with examples); Tab 2 is the grid they fill; Tab 3 is a short, optional triggers ask. Keep it to the genuinely-blank cells so a client finishes in 10 to 15 minutes.

### Tab 1 - "Start here" (instructions + examples)

Paste this text at the top, then the example table below it:

> **What this is.** A quick place to give us your real customer results so we can write outbound that names real clients and real numbers. We've already filled in everything we could find from your site and our calls. We just need you to confirm those and fill the blanks.
>
> **Why it matters.** Cold emails that name a real client and a real result get replies. Vague ones ("we helped a leading firm") get ignored. We'd rather use your real numbers than guess, so this is the highest-leverage 15 minutes you can give the campaign.
>
> **How to fill it.** Go to the "Your results" tab. Each row is one customer result. Fill the columns left to right. You only give us the facts. We write the actual emails. If you can't name a customer, just say so in the "Can we name them?" column and we'll describe them instead (e.g. "a 200-person logistics firm"). If a number is approximate, give your best real figure. Never invent one. The examples below show the shape. Delete them or leave them, either is fine.

**Example rows (the fill-guide, industries deliberately mixed):**

| Which customer? | Can we name them? | What did you do for them? | Their industry / type | Where | The result (a real number) | Over what period | What it looked like before (optional) |
|---|---|---|---|---|---|---|---|
| Northwind Software | Yes | Onboarding automation module | B2B SaaS | US | Cut churn 22% | 2 quarters | Manual onboarding, customers dropping in month 2 |
| Ardent Components | Describe only (call them "a mid-size parts maker") | Supply-planning rollout | Manufacturing | UK & DE | Reduced lead time by 18 days | 6 months | Orders slipping, planning on spreadsheets |
| Riverside Clinic | Yes | No-show reduction program | Healthcare provider | US | Cut no-show rate from 19% to 7% | 12 months | 1 in 5 appointments missed, revenue leaking |
| Beacon Home Services | Yes | Local demand + booking system | Home services | Texas | Booked 40% more jobs | 90 days | Leads going cold, no follow-up system |
| Loom & Co | Yes | Repeat-purchase program | Ecommerce / DTC | US & CA | Grew repeat-purchase revenue 3x | 1 year | One-and-done buyers, no retention motion |
| Halden Advisory | No (NDA) | Compliance review | Professional services | UK | Recovered 480k in one review | One engagement | Missed recoverable costs sitting undetected |

### Tab 2 - "Your results" (the grid to fill)

Same columns as the example table, pre-filled with any rows we already found (mark those "please confirm"), then blank rows grouped by ICP segment. Columns:

1. **Which customer?** (the client / customer name)
2. **Can we name them?** (Yes / No, describe only / Ask me)
3. **What did you do for them?** (the service, product, program, or job)
4. **Their industry / type**
5. **Where** (country / region)
6. **The result (a real number)** (the metric you'd defend if a prospect asked)
7. **Over what period** (e.g. "3 months", "Jan-Dec 2025", "since launch")
8. **What it looked like before** (one line, optional, gives the result contrast)

Group the blank rows under a small header per ICP segment (e.g. "Results with SaaS clients", "Results with manufacturers"), so the client fills the segments a campaign actually needs. Only include segments we're still missing proof for.

### Tab 3 - "Timing + competitors" (optional, light)

The message-only triggers we can't find ourselves. Four short questions, free text:

1. **When does a customer usually realize they need you?** (the moment or event that makes them ready)
2. **Any seasonal or deadline timing that drives demand?** (budget cycles, seasons, regulatory dates)
3. **Who are your main competitors?** (names, so we can spot prospects using them)
4. **Any events, webinars, or conferences you'll be at soon?**

Skip Tab 3 entirely if the campaign only needs proof.

---

## How the skill builds and shares the sheet

Preferred path, **live Google Sheet via the google-docs MCP** (so the client edits in place and we see it come back):

1. `createSpreadsheet` titled `"{Client} - Proof + Results (for your outbound)"`.
2. `writeSpreadsheet` / `appendRows` to lay down the three tabs above: Tab 1 instructions + example table, Tab 2 the pre-filled + blank grid grouped by segment, Tab 3 the four timing questions. Use `setDropdownValidation` on "Can we name them?" (Yes / No, describe only / Ask me).
3. `setFilePermission` to share it with the client's email as an editor (or anyone-with-link editor if the operator prefers), and get the shareable link.
4. Drop the link into the outreach message below and send. Log it `PENDING` in the client's activity log.

**Fallback when the google-docs MCP or its credentials are not available:** generate the same template as a spreadsheet file the operator can upload to Google Sheets manually:

```
python "<coldoutbound-skills>/scripts/social_proof_bank_to_xlsx.py" --client <business-slug> --template
```

`--template` writes `profiles/<slug>/social-proof-bank-client-fill.xlsx` with the three tabs and the example rows baked in (a blank client-fill workbook, distinct from the populated internal bank export). The operator uploads it to Drive as a Google Sheet and shares it. Same content either way; the markdown template here is the single source of the structure.

On the client's return: fold the raw facts into `social-proof-bank.md`, flip those rows `on_file`, synthesize their one-liner + poke-the-bear, write the confirmed proof back into `client-profile.yaml` `proof:`, and move the activity-log line to `DONE`.

---

## Ready outreach message: EMAIL

Fill the brackets, trim to what's true, send with the sheet link. Covers what / why / how in that order.

```text
Subject: Quick one - your real results so we can name them in your campaigns

Hi {client first name},

Quick ask that will make a real difference to your outbound.

What: I've put together a short sheet of your customer results here: {sheet link}.
I've pre-filled everything I could find from your site and our calls. I just need
you to confirm those and fill a few blanks.

Why: the cold emails that get replies name a real client and a real number.
The vague ones ("we helped a leading firm") get ignored. I'd rather use your real
results than guess, so this is genuinely the highest-leverage 15 minutes you can
give the campaign.

How: open the sheet, read the short "Start here" tab (it has examples), then fill the
"Your results" tab. You only give me the facts - the customer, what you did, the
result, the timeframe. I write the actual emails from there, so you won't need to
phrase anything. If a customer can't be named, just say so and I'll describe them
instead. If a number's approximate, your best real figure is fine.

Once it's back I'll have the campaign copy over to you for review.

Thanks,
{sender name}
```

## Ready outreach message: SLACK

Shorter, same what / why / how, for a Slack DM or client channel.

```text
Hi {client first name} - quick one that really moves the needle on your outbound.

*What:* a short sheet of your customer results -> {sheet link}. I've pre-filled what
I could find; just need you to confirm and fill a few blanks.

*Why:* emails that name a real client + a real number get replies; vague ones get
ignored. Real beats guessed, so this is the best 15 min you can give the campaign.

*How:* open it, skim the "Start here" tab (has examples), fill the "Your results" tab.
Facts only - customer, what you did, the result, the timeframe. I write the emails
from there. Can't name a customer? Just say so and I'll describe them. Approximate
number? Your best real figure is fine.

I'll have the copy back to you for review once it's in. Thanks!
```

Keep both honest and specific. Never imply the client has to write copy, and never pressure. The ask is small because we did the gathering first.
