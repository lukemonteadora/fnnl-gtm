---
name: smartlead-reply-agent-setup
description: Set up Smartlead "Reply Agent by SmartAgents" coverage for a cold-email client so every inbound reply gets an instant, on-brand, context-aware reply the moment it lands (target: under 5 minutes). Deploys a per-client PACK of Reply Agents that covers every meaningful reply category, with human-reviewed drafts for anything with intent and true auto-send only for mechanical Out-of-Office / auto-reply acknowledgements. Use when run_state.sending_platform = Smartlead and a client has (or is about to have) live campaigns receiving replies. Triggers: "set up reply agents for <client>", "add SmartAgents for <client>", "automate <client>'s replies", "/smartlead-reply-agent-setup". Browser-only (no public API/MCP for Reply Agents). Runs after the campaign drafts exist; pairs with /smartlead-inbox-manager (client-access must exist first) and /smartlead-campaign-upload-public.
---

# Smartlead Reply Agent Setup (SmartAgents)

> **What this does in one line:** gives each client an AI "reply desk" inside Smartlead's Master Inbox so that the instant a prospect replies, a ready, on-brand response is waiting (drafted for a one-click human send, or auto-sent for the purely mechanical stuff). That is how we hit "reply ASAP, under 5 minutes" without a human watching the inbox all day.

Use this skill only when `run_state.sending_platform = Smartlead`. It is the reply-side counterpart to `/smartlead-inbox-manager` (which handles senders) and `/smartlead-campaign-upload-public` (which handles outbound). It does not send outbound and it does not change campaigns.

## Why Reply Agents (the goal)

Top-1% outbound is not just good sending, it is **fast, good replies**. A booked meeting often comes down to who replied first and best. The Reply Agent reads the whole thread plus the lead's category and writes the response for you, so the human step shrinks to "glance and click send" (or nothing at all for mechanical replies). Set it up once per client and the reply work is mostly automated.

## How the Reply Agent works (the platform, verified live in the UI)

- **Where it lives:** Smartlead → **Master Inbox** → **Drafts by Agent** (URL `app.smartlead.ai/app/master-inbox?action=DRAFTS_BY_AI`). The agents themselves are managed at **SmartAgent → My Agents → Reply Agents** tab (`app.smartlead.ai/app/smart-agent/agents`).
- **It reads context automatically.** The agent reads the prior messages in the thread and the campaign the lead came from. You do not paste per-lead copy. You give it standing guidance (offer, tone, objection handling) once.
- **Two reply modes:**
  - **Manual Reply preview** = "Review and approve each reply before sending." The draft appears in Drafts by Agent; a human sends with one click. **Nothing is sent without review.**
  - **Auto Send Replies** = "AI will automatically send replies without manual review." The AI emails the prospect on the client's behalf, unattended.
- **One agent = one job.** Each agent has exactly ONE Primary Goal, ONE scope, ONE set of lead categories, ONE reply mode, ONE tone, ONE length, and one block of guidance. To cover different reply types well you deploy a small **pack** of agents per client (see below), not one mega-agent.
- **No public API / no MCP.** Reply Agents are browser-only. The backend runs through a signed same-origin `/gateway/` proxy with opaque bodies; the documented `server.smartlead.ai` API is CORS-bound from the app. Do not try to script agent creation. Build in the UI.

### The 6-step creation wizard (exact fields)

1. **Goals & Scope** — `Primary Goal` (dropdown): **Book Meeting · Re-engage Lead · Close Deal · Qualify Lead**. `Agents Scope` (radio): **Account-level · Client-level · Campaign-level**; Client-level and Campaign-level then show a searchable picker (Client-level lists clients by contact name + email, e.g. "Alex Rivera - alex@example.com").
2. **Lead Category** — `Category Application`: **Apply across all email replies** OR **Specific lead categories** (multi-select chips).
3. **Reply Modes** — **Auto Send Replies** OR **Manual Reply preview**.
4. **Reply Tone & Length** — Tone: **Professional** (clear, formal, respectful) · **Casual** (relaxed, simple) · **Friendly** (warm, kind, personable) · **Direct** (clear, engaging, action-focused). Length: **Short** (30-50 words) · **Medium** (80-120) · **Long** (150-200).
5. **Context & Guidance** (the knowledge injection, all optional, up to 10,000 chars each): **Personalized Communication Style**, **Context & Business Logic**, **Objection Handling Reference**, and **Resources to Share** (repeatable Name + Link + Description; this is where a booking/calendar URL or one-pager goes).
6. **Integrations** — **Calendly** (OAuth "Connect", operator-only) and **Slack** (Coming Soon). Then **Deploy Agent**.

The full category taxonomy (17, as of 2026-06-24): Do Not Contact, Information Request, Out Of Office, Wrong Person, Interested, Meeting Request, Not Interested, Outdated Email, Retired, Referral, Future Contact, Uncategorizable by Ai, Custom Response, Sender Originated Bounce, Push Lead, Automated Reply, Meeting Booked. (Re-read this list live when building; Smartlead may add categories.)

## The per-client pack (the strategy)

Deploy this 4-agent pack per client. The category map is **exhaustive and disjoint**: every meaningful category is owned by exactly one agent, and the rest are deliberately excluded. The Primary Goal is chosen to match the category cluster (never book-meeting an "out of office").

| Agent (name `<Client> \| <Role>`) | Primary Goal | Lead categories | Reply mode | Tone / Length |
|---|---|---|---|---|
| **Booker** | Book Meeting | Interested, Meeting Request | **Manual** | Direct / Short |
| **Qualifier** | Qualify Lead | Information Request, Custom Response, Wrong Person, Referral | **Manual** | Professional / Medium |
| **Re-engager** | Re-engage Lead | Not Interested, Future Contact, Retired | **Manual** | Friendly / Short |
| **Auto-Acknowledge** | Re-engage Lead | Out Of Office, Automated Reply | **Auto Send** (opt-in) | Professional / Short |

**Excluded from every agent (never draft or auto-reply):** Do Not Contact (compliance), Outdated Email (no valid recipient), Sender Originated Bounce (not a human), Uncategorizable by Ai (too ambiguous to answer safely), Push Lead (an internal routing action, not a reply intent), Meeting Booked (already converted). If the operator wants coverage on one of these, surface it as an explicit decision; do not silently include them.

All agents use **Client-level** scope by default (one offer per client, so one set of agents covers all that client's campaigns). Use **Campaign-level** only when a client runs campaigns with materially different offers or CTAs that need different reply behavior.

### HARD RULE — auto-send policy (hybrid, default)

**Manual Reply preview is the default for everything with intent.** True **Auto Send is allowed ONLY for the Auto-Acknowledge agent (Out Of Office + Automated Reply)** — mechanical acknowledgements where no judgment is needed. Never auto-send anything carrying intent or nuance (Interested, Meeting Request, Information Request, Custom Response, Not Interested, Referral, Wrong Person). Auto-sending re-engagement at someone who just said "not interested" is the single highest spam-complaint and brand risk in the set.

**Auto Send sends real emails to real prospects on the client's behalf.** That is a send-on-behalf action, not a config tweak. **Get explicit operator opt-in before deploying ANY Auto Send agent.** Manual agents (draft-only) are safe to deploy hands-free under `auto_execute`. If the operator has not opted into auto-send, deploy the 3 Manual agents and leave Auto-Acknowledge out (or deploy it in Manual mode). The operator's standing choice is recorded per client in `profiles/<client>/activity-log.md`.

## Per-client Context & Guidance (fill from the client profile, never fabricate)

Pull the real values from `profiles/<client>/client-profile.yaml` (and `offer-intelligence.md` / `campaign-strategy.md`). Do not invent capabilities, customers, or links (capability-truth Hard Rule). The three free-text fields, per agent:

- **Personalized Communication Style:** who the sender persona is (name, title, company, location), use the recipient's first name, the client's tone (e.g. peer-to-peer / plain), reply in the prospect's language, and the formatting rules. **Always include: "Never use a spaced em dash; use short sentences, commas or parentheses instead"** (the operator's hard rule applies to AI-drafted replies too). Sign off as the persona's first name.
- **Context & Business Logic:** what the company does, the value prop, the buyer/ICP, the real reference customers (mention only when true and relevant), AND this agent's job (e.g. Booker: "turn a positive reply into a booked 15-20 min call; one clear ask; propose 2-3 times or ask availability"). **Booking link rule:** if no booking URL is on file, instruct the agent to propose times / say the persona will send a link, and do NOT paste a fabricated calendar URL. Add a real booking link as a Resource to Share only when the operator provides one (or connect Calendly via the Integrations step, which is operator OAuth).
- **Objection Handling Reference:** the client's 4-6 most common objections and how the persona answers them (happy-with-current-tool, no-time/mid-migration, just-send-info, budget, who-are-you). Derive from the offer's pain points. End with "Never argue, never be pushy, keep every reply short."

Share the same company business logic across that client's agents; vary the per-agent "job" line and the tone/length per the pack table.

## UI SOP (browser, hands-free under the browser-fallback rule)

Reply Agents are an already-logged-in dashboard, so the agent completes this in the browser per `/autonomous-execution-policy` §6 (never authenticate, never connect OAuth, never cross a hard stop). Use Claude-in-Chrome.

**Gotchas learned live (bake these in):**
- **No Clone.** Each agent is a separate full wizard run. There is no duplicate/clone action. Budget for it.
- **Rename AFTER deploy.** The wizard's inline title edit does NOT persist. Deploy first, then **My Agents → Reply Agents tab → row ⋮ → Rename Agent** to set `<Client> | <Role>`. (⋮ also has **Edit Reply Agent** and **Delete** — deployed Reply Agents ARE editable; the "cannot edit after creation" warning applies only to event-trigger SmartAgents, not Reply Agents.)
- **Renderer is flaky.** Screenshots intermittently time out ("renderer unresponsive") and the modal re-renders at different zooms, so pixel coordinates drift. Prefer element refs (`read_page` / `find`) over coordinates. Re-screenshot after a 2-3s wait if one times out.
- **Comboboxes (client picker) render their option list clipped/below the fold.** Reliable pattern: click the field, type a unique substring, then **ArrowDown + Return** to select the first match (or `find` the option ref and click it).
- **Multi-select category dropdown** stays open as you click; clicking a category by `find`-ref is most reliable. Click outside to close, then verify the chips.
- **Tone/Length/Mode** are simple cards/radios; coordinate clicks are fine once the layout is stable.

**Steps per agent:**
1. Master Inbox → Drafts by Agent → **Get started** (or SmartAgent → My Agents → Reply Agents → **Create Reply Agent**).
2. Step 1: pick Primary Goal; pick Client-level; in the picker type the client and ArrowDown+Return to select. Continue.
3. Step 2: Specific lead categories; multi-select exactly this agent's categories (verify chips). Continue.
4. Step 3: Reply mode (Manual for Booker/Qualifier/Re-engager; Auto Send for Auto-Acknowledge only after opt-in). Continue.
5. Step 4: Tone + Length per the pack table. Continue.
6. Step 5: paste the three Context fields. Leave Resources empty unless a real booking link/one-pager exists. Continue.
7. Step 6: skip Calendly (operator OAuth). **Deploy Agent.**
8. Deploy confirmation → **Go to My Agents** → Reply Agents tab → ⋮ → **Rename Agent** to `<Client> | <Role>`. Confirm Agent Status toggle is ON.

Repeat for all 4 roles, then move to the next client.

## Verify

- In **My Agents → Reply Agents**, confirm each agent: correct name, **Agent Scope = Client level** (the right client), **Agent Status = ON**.
- Confirm the category map is disjoint across the client's pack (no category in two agents).
- For a live client, eyeball the first few drafts in **Drafts by Agent** once replies arrive: check quality, that no spaced em dash appears, that no fabricated booking link is inserted, and how fast the draft shows up. Adjust an agent via ⋮ → Edit if a draft is off. (For clients whose client-access has `reply_master_inbox`, these drafts are visible in the client's own portal, so draft quality is client-facing from day one.)

## Activity log + memory

Per the Client Activity Log protocol, after setup append a one-line entry to `profiles/<client>/activity-log.md` LOG and refresh CURRENT STATE: which agents were deployed (names + modes), the auto-send choice, and any flagged gap (e.g. "no booking link on file, Booker proposes times"). Status vocab: CREATED/EXISTS/PENDING/BLOCKED/DONE.

## Interaction policy

Defers to `/autonomous-execution-policy`. Under `auto_execute`, deploy the Manual agents hands-free; the only stop is the auto-send opt-in (a send-on-behalf permission). Never connect Calendly OAuth or any integration that requires authentication. This skill spends no API budget (browser-only, no paid calls).

## Where this runs in the cold-email flow

- **/cold-email-kickoff** and **/continue-client**: run this once the client's first campaigns are built (drafted is fine; the agents wait for replies). Setting them up at draft time means the client is reply-ready the moment the operator presses Start.
- **/smartlead-inbox-manager**: the client-access entity must exist BEFORE this runs (Client-level scope needs it). Inbox-manager creates client-access in the import pass; this skill consumes it.
- **/smartlead-campaign-upload-public**: a natural follow-on after a draft campaign is created for a new client or a new campaign is added.
- New client OR new campaign for an existing client → check whether the reply-agent pack covers it (a new campaign under the same client + offer is already covered by Client-level agents; a campaign with a different offer may want Campaign-level agents).

## Reference implementation: ExampleCo, a B2B SaaS client (deployed 2026-06-24)

First client built end to end as the template. Persona: one partner-level sender at the client (the locked persona from its client profile). Client-access "Alex Rivera - alex@example.com" (id `<client_id>`). The contact and id here are placeholders: fill in the client's real client-access contact and id. Pack:
- **ExampleCo | Booker** — Book Meeting / {Interested, Meeting Request} / Manual / Direct / Short. (Deployed + live.)
- **ExampleCo | Qualifier** — Qualify Lead / {Information Request, Custom Response, Wrong Person, Referral} / Manual / Professional / Medium.
- **ExampleCo | Re-engager** — Re-engage Lead / {Not Interested, Future Contact, Retired} / Manual / Friendly / Short.
- **ExampleCo | Auto-Acknowledge** — Re-engage Lead / {Out Of Office, Automated Reply} / Auto Send / Professional / Short. (Auto-send per operator hybrid opt-in 2026-06-24.)

Context fields used the client's value prop, its finance-buyer ICP, its named reference customers, a peer-to-peer tone, and the "no booking link on file, propose times" rule. See `profiles/<client>/activity-log.md`.
