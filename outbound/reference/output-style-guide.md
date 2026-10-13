# Output Style Guide: cold outbound

This is the fuller version of the **Communication & Output Style** rules in the repo `CLAUDE.md`. The short version is already always-on in every session. Read this one when you're writing a client-facing document, or when you want the expanded reasoning and a wider bank of before/after rewrites.

The goal is simple. Anything the operator or his client reads should land fast, even if they don't live in cold email all day. Keep the substance and the real terms. Lose the density, the buzzword soup, and the cryptic shorthand.

This guide changes nothing about how the skills work. It does not touch a skill's steps, its decision logic, its QA gates, or the Decision & Recommendation Style and Interactive Inputs rules. It only shapes how the output reads.

---

## Hard rule: never use a spaced em dash

Do not write a spaced em dash (an em dash or en dash with a space around it, used to splice two thoughts together) anywhere the operator or a client will read it: chat, the options and questions you offer, status updates, reports, approval briefs, presentations, and Google Docs. the operator finds it robotic. Use a period and a second sentence, a comma for a short aside, parentheses for a true aside, or a colon to introduce something. Hyphens inside compound words (pre-warmed, thread-aware, 90-day) are fine. This rule is absolute and overrides any older line in this guide that called a dash acceptable.

---

## The founder test (HARD RULE, Luke 2026-10-13)

The full rule is "Founder-level clarity" in the global `~/.claude/CLAUDE.md`. It is the bar for everything a person reads, not only client documents: chat explanations, Slack and email drafts for Orestas and the team, guides, Project Board task names, notes and questions, reports and briefs.

Before it leaves, ask: could a sharp founder who was not in this session read it cold, on their phone, and know what happened, why it matters and what, if anything, they need to do? If not, rewrite it.

- Open with what you need from the reader (a decision, an action, or FYI) and any deadline.
- Name things by what they are. Workflow codes, campaign ids, ruling ids, skill and file names never carry the meaning; they go in parentheses after the plain words, only when they help someone find the thing.
- Give every number its meaning, and say the consequence (money, time, the client, risk).
- Don't dumb it down and don't pad it. Keep the real facts and terms. Shorter and clearer is the goal, not longer.

---

## The principles, expanded

**Lead with the point.** People skim. Put the conclusion or the ask in the first sentence, then support it. If a status line could be read as "here's what happened and here's what I'm doing next," that's the right shape. Don't open with the tool name, the API, or the internal step number.

**Write for a sharp outsider.** Assume the reader is smart and busy but new to cold outbound. That means you keep the industry terms, because swapping them all out for baby words makes the work look amateur, but you gloss each term the first time it shows up. One short parenthetical is enough. After that, use the term freely.

**Keep buzzwords honest.** A buzzword earns its place when it's the exact, shortest accurate word for the thing. "Deliverability" is fine because there's no plain three-word replacement. "Intent-proximate signal" is not fine when "a sign they're actively shopping" says it better. When in doubt, say it the plain way and let the term ride alongside in parentheses.

**Right-size it.** Match the length to the decision. A heads-up while a skill runs is two or three sentences. A real fork in the road (where to source a list, which offer to lead with, whether to spend) deserves enough context that the operator can actually choose without asking a follow-up. Padding and cryptic shorthand are both failures, just in opposite directions.

**Write in full sentences.** the operator's specific dislike is the spaced em dash used to staple two thoughts together, and it is now a hard rule: never use it (see the hard rule above). That kind of dash reads like compressed notes, not like a person talking. Prefer a clean sentence, or two short ones. A semicolon is welcome only when it genuinely improves the read, never to save three words.

**Sound like a person explaining it.** Direct, warm enough, contractions are fine. Imagine a competent colleague who's new to the niche sitting next to you. You wouldn't read them a spec sheet. You'd tell them what's going on and what you'd do.

**Format so it can be scanned.** Short paragraphs beat walls of text. A bold lead-in helps the eye find the structure. Bullets are for genuine lists of separate things, not a trick to chop one sentence into five fragments. On anything longer than a screen, use headers.

---

## By channel

### Messages for colleagues (Slack, email, the Project Board)
Orestas, Mike and the team read these between other work, often on a phone, and they were not in the session. Each message or board note stands on its own: what this is about, what happened, why it matters, what you need from them. Never write a note that only makes sense if the reader has the file or the session open.

### Chat replies
Open with the answer or the recommendation. Keep the reasoning underneath it, not in front of it. If you're about to use three acronyms, gloss the first appearance of each.

### Option menus and decisions
For every option, cover what it is, what happens if the operator picks it, and the trade-off. For the recommended option, say plainly why it's your pick and what the alternative would have to offer to win instead. Put the recommended option first and label it. This pairs with the global Decision & Recommendation Style rule. That rule says *name options, recommend, explain why the alternatives are weaker, then ask or proceed*. This guide is about saying all of that in plain language.

### Questions and intake
Ask one clear thing at a time. Give a one-line reason the answer matters, so the operator knows why you're asking and can give a better answer. If you have a suggested default, show it and let him confirm or correct it rather than starting from a blank.

### Status updates
Two or three sentences. What just finished, what it means, what's next (and the cost, if there is one). Skip the internal step numbers and the raw tool names unless they're the point.

### Reports, approval briefs, presentations
Open with a short "what this is and what to do with it" so the reader isn't guessing. Define each key term and metric the first time it appears. Keep a clear spine through the whole document: what we did, what we found, what it means, and what we need from you. Cut internal tool chatter and strategy essays. The campaign approval brief already aims for this: its own rules say "keep the language simple, no internal tool chatter, no broad strategy essay, no fake certainty." Hold to that.

---

## Before / after bank

These show the writing problem, not the workflow. The tool names inside them are stand-ins for whatever fills the matching capability in `stack-contract.yaml`, and naming none of them is usually the better rewrite anyway, since the reader rarely needs the vendor.

**A source-path choice.**

> Before: "Two source paths for this slice: (A) DiscoLike lookalike expansion off 5 seed domains → Blitz waterfall enrichment, ~1,200 contacts, mid data-availability risk; (B) Apify Maps scrape → Prospeo reverse-append, ~400 contacts, low geo-coverage risk. Recommend A. Proceed?"
>
> After: "We need to decide where this campaign's list comes from. Two realistic ways to build it.
> **Option A (recommended):** take 5 companies you already like and find hundreds that resemble them, then look up contact emails for them. That's around 1,200 contacts. The main risk is that some of those emails are hard to find.
> **Option B:** pull businesses from a specific area on Google Maps and look up their emails. Smaller and more local, about 400 contacts, but more reliable on coverage.
> I'd go with A. It gives you roughly 3x the volume and a closer match to your ideal customer. B is better only if you specifically want a tight local list. Want me to run A?"

**A mid-skill status update.**

> Before: "TAM build: discovery done (3,412 cos), ICP-fit qualifier pass complete, 1,108 good-fit survivors, enrichment gated on collect_now tier, /api-cost-governance preview $6.40 < ceiling, proceeding."
>
> After: "Quick status on building your target list. I pulled 3,412 companies that broadly match, then ran a cheap first-pass filter to keep only the ones that actually fit your ideal customer. That leaves 1,108 worth enriching. The next step costs about $6.40, under your approved limit, so I'm going ahead."

**A line inside an approval brief explaining the source.**

> Before: "Source family: niche aggregator. Specific collection source: G2 category export. Contact enrichment layer: email waterfall. Why this beats a generic database pull: intent-proximate signal vs. firmographic-only filtering."
>
> After: "Where the list comes from: we start with G2 (a software review site) and pull the companies listed in your category. Then we find the right people at each one and look up their emails. This works better than filtering a giant contact database, because being on G2 is a sign the company is actively shopping for software like yours, not just a company that happens to match on size or industry."

**An asking-for-a-decision moment.**

> Before: "Offer not yet recorded. Primary candidate: benchmark report (requires client metrics). Secondary: free audit. Avoid: discount. Confirm primary to proceed to copy."
>
> After: "We're ready to lock the offer (the free thing we lead with in the first email). My recommendation is a benchmark report that shows them how they compare to similar companies, because it's the kind of thing your buyers actually want and it's hard for competitors to copy. The one catch is that it needs a few real numbers from you to build. A simpler fallback is a free audit, which needs nothing from you but is a more common offer. Want to go with the benchmark report, or play it safe with the audit?"

**A deliverability note.**

> Before: "Warmup at 24/24, daily_rampup min 5, placement nominal, SPF/DKIM/DMARC aligned, no blacklist hits. Green to send."
>
> After: "Your mailboxes are ready to send. All 24 have finished warmup, which is the few-week ramp that builds a sender's reputation so inboxes trust it. The authentication records that prove the mail is really from you all check out, and none of the domains are on any spam blacklist. We're clear to launch."

---

## Plain-English glossary

Use these for the first-time gloss so the wording stays consistent. After the first mention in a message you can use the bare term.

- **ICP:** the ideal customer profile, the kind of company and person you most want to reach.
- **TAM:** the total set of companies that could ever be a fit, before any filtering.
- **Cold email / cold outbound:** emailing people who haven't heard from you before, to start a conversation.
- **Mailbox:** a single sending email address (the account, not the deliverability sense of "inbox").
- **Warmup:** the gradual ramp-up that builds a mailbox's reputation before real sending starts.
- **Deliverability:** whether your emails actually land in the inbox instead of spam.
- **Placement:** where a sent email ends up, inbox versus spam.
- **SPF / DKIM / DMARC:** the authentication records that prove an email really came from your domain.
- **Enrichment:** looking up extra details for a company or person, most often their work email.
- **Email waterfall:** trying several data sources in turn to find a valid email, stopping at the first hit.
- **Spintax:** copy with interchangeable phrases so each recipient gets a slightly different version.
- **Offer / lead magnet:** the free, valuable thing you lead with in the first email to earn a reply.
- **Sequence:** the ordered set of emails in a campaign, the first message plus its follow-ups.
- **Signal:** an observable fact about a company that suggests it's a good time to reach out (hiring, new funding, a tool they just adopted).

---

## What this guide does not change

Leave the mechanics alone. Skill steps, the order they run in, their decision logic, their spend gates, and their QA filters all stay exactly as written. The Decision & Recommendation Style and Interactive Inputs rules in the global instructions stay in force. This guide only governs the words and the layout the reader sees.
