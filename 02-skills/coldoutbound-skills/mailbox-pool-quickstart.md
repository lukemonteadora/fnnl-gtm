# Mailbox Pool — Quickstart

Four common operations for `/mailbox-pool-staging`. Source of truth = the **"Cold Email Mailbox Pool"**
sheet (`<FNNL_MAILBOX_POOL_SHEET_ID>`).

**Before any of this works, the sheets have to exist.** `<FNNL_MAILBOX_POOL_SHEET_ID>` and
`<FNNL_MAILBOX_TRACKER_SHEET_ID>` are placeholders, not real IDs. Create the two sheets (the pool sheet and
the mailbox tracker) in whatever tool fills `operations.spreadsheet` in `stack-contract.yaml`, then replace
both placeholders with the real IDs here and in the contract. Until that is done, every step below that reads
or writes a sheet fails.

The `pool_*.mjs` scripts under `scripts/` are pure logic and run regardless of stack. The agent does the sheet
I/O and the sending-platform I/O. Read `profiles/_mailbox-pool/activity-log.md` first; write it after.

## Writing rows to the sheet (read once)

The computed columns are spilling `ARRAYFORMULA`s, so when you add or update rows: **don't use `appendRows`**. Find the next free row by reading **column A**, then `writeSpreadsheet` the **input sub-ranges only**: DOMAINS `A:I`, `K:O`, `Q:S`; MAILBOXES `A:G`, `I:J`, `L:P`. **Never** write the formula columns (DOMAINS `J`/`P`, MAILBOXES `H`/`K`), because the spill fills them automatically; writing them `#REF!`s the column and kills the `ready` gate. Tag definitions on the sending platform (`stage-1`, `group-…`, `market-…`) must exist before anything maps mailboxes onto them. Use the tag helper shipped by the activated pack for the locked `run_state.sending_platform`, if there is one: it lands in `scripts/` when the pack activates (the Smartlead pack ships `smartlead-tags.mjs`, so that route reads `node scripts/smartlead-tags.mjs create-tag <name>`). If no pack is active, create the tags on the platform's native surface first. If the platform has no tag concept at all, keep the grouping in the sheet only and say so in the log rather than implying the mailboxes are tagged.

---

## 1. Add a Stage-1 `.co` tranche (pre-warm ahead of demand)

Goal: warmed disposable inventory so a future client launches instantly. **Size to near-term pipeline only.**

1. Decide how many groups (1 group = 6 `.co` domains / 12 mailboxes). Confirm spend against `spend_ceiling_usd`.
2. For each group, orchestrate the existing flow — do NOT hand-roll any of it:
   - `/mailbox-mix-strategy` is for signed clients; for the pool, use the fixed **70/30 Google/Microsoft** pre-warm mix (≈4 Google + 2 Microsoft domains, whole domains on one provider).
   - **Domains and mailboxes:** use the domain-setup skill for the registrar and mailbox provider locked in `run_state.registrar` and `run_state.mailbox_provider` (recorded jointly as `run_state.infrastructure_stack`), if `/stack-setup` activated a pack that provides one. The `domain-infra` pack ships one skill per registrar-and-provider *pairing* rather than per tool, so the route is the pairing FNNL actually buys on (`/spaceship-zapmail-domain-setup` is one such pairing). If no pack is active, buy and configure on the registrar's and the provider's own surfaces. Either way the outcome is the same: 6 `.co` domains with **`autoRenew: false`** plus 12 mailboxes (one persona). If neither slot is filled yet, stop and run `/stack-setup`. Do not pick a registrar.
   - `/mailbox-profile-generator` → persona assets BEFORE export.
   - **Import and warmup:** use the inbox-manager skill for the locked `run_state.sending_platform` if an activated pack provides one (`/smartlead-inbox-manager` is that skill in the Smartlead pack). Otherwise import the mailboxes and enable warmup (the new-sender ramp) on the platform's native surface. If the platform has no warmup feature, do it manually and say so, rather than implying the ramp happened.
3. Log to the sheet (`writeSpreadsheet` to the input sub-ranges per **Writing rows** above — never `appendRows`): 6 DOMAINS rows (`tld co, stage 1, group_id s1-NN, auto_renew OFF, assigned_client pool, status warming`, fill SPF/DKIM/DMARC/tracking/forwarding as verified) + 12 MAILBOXES rows (`stage 1, group_id s1-NN, provider, in_smartlead Y, warmup_start_date <today>, warmup_health good, assigned_client pool, status warming`). The `in_smartlead` column name is a carried-over label, not a statement that FNNL uses Smartlead: it means "imported into the sending platform", whichever platform is locked. **Do not rename it**, because `pool_lib.mjs`, `pool_warmth.mjs`, and `/mailbox-pool-staging` all read it by that exact name. Leave the formula columns (DOMAINS `J`/`P`, MAILBOXES `H`/`K`) untouched.
4. Tag the mailboxes `stage-1` and `group-s1-NN` on the sending platform, creating the tag definitions first if they are new (routing per **Writing rows** above). With the Smartlead pack active that reads `node scripts/smartlead-tags.mjs create-tag stage-1`, then `node scripts/smartlead-tags.mjs tag-map <accIds> <stage-1,group-s1-NN tagIds>`. With no pack active, apply the same two tags on the platform's own surface.
5. Update `pool-manifest.md` + the pool activity log.

The DASHBOARD now shows the group under "warming"; in ~3 weeks `pool_warmth.mjs` flips it to ready.

---

## 2. Assign a ready group to a new client (the days-not-weeks moment)

1. Read the client's **market** from `profiles/<client>/client-profile.yaml` (map to the controlled vocabulary).
2. `readSpreadsheet` MAILBOXES + DOMAINS → build a payload `{ request:{client, market, stage:"1"}, mailboxes:[...], domains:[...], today:"<YYYY-MM-DD>" }`.
3. `node scripts/pool_allocate.mjs find payload.json` →
   - **eligible group returned** → assign it: set `assigned_client = <client>`, `market`, `status = deployed` on its DOMAINS + MAILBOXES rows (`writeSpreadsheet`); create the client-access entity on the sending platform if it has that concept (with the Smartlead pack active: `node scripts/smartlead-client.mjs create "<Contact>" <email> "<Company>"`, then assign mailboxes in the browser per `/smartlead-inbox-manager`; with no pack active, do the equivalent on the platform's own surface); re-tag `market-<slug>`.
   - **`market_conflict`** → another client is live in this market: pick a different market group, or get an explicit override plus a dedup of both lists at the list-building layer, before either campaign sends.
   - **`provision_fresh: true`** → no clean ready group: fall through to flow #1 for this client.
4. Launch: `/campaign-copywriting`, then the campaign-upload skill for the locked `run_state.sending_platform` if an activated pack provides one (`/smartlead-campaign-upload-public` and `/emailbison-campaign-upload-public` are those skills in their respective packs); otherwise upload on the platform's native surface. Then log the mailboxes to the client's inbox tracker: an inbox-tracker skill if the workspace has one, otherwise write them to the tracker sheet directly.
5. Write both logs (pool + client).

---

## 3. Promote through stages with a seamless cutover

Stage 1 → 2 (`.co` → `.com`), or Stage 2 → 3 (→ branded `.com`). Same bridge each time.

1. **Provision the next stage fresh** and warm it **in parallel** while the current stage keeps sending:
   - Stage 2 = a fresh generic `.com` group; Stage 3 = the client's branded `.com` (e.g. `getclientbrand.com`).
   - Same flow as #1: domain setup for the locked registrar-and-provider pairing, then `/mailbox-profile-generator`, then import plus warmup on the locked sending platform (each routed as in #1). Log to the sheet as `stage 2` (or `3`), `group_id s2-<client>` / `s3-<client>`, `assigned_client <client>`, `status warming`.
2. When the new group is **ready**, cut over: point **new** sends at the new-stage mailboxes (a new campaign, or swap the senders on the existing one, via the campaign-upload skill for the locked sending platform or that platform's own surface). Leave the old-stage campaign running.
3. **Thread-aware retire gate.** Pull the OLD-stage campaign's leads from the sending platform, specifically lead status plus reply categories (with the Smartlead pack and MCP active that is `smartlead_list_leads_by_campaign`; otherwise export the same two fields from the platform's native surface, and if it exposes neither, do not retire the group on guesswork). Then `node scripts/pool_cutover.mjs payload.json`:
   - `safe_to_retire: false` → in-flight sequences or open replies remain; **hold**, re-run later.
   - `safe_to_retire: true` → set the old group `status = retired` (or `quarantined` if recyclable). No sequence or reply was dropped.
4. Write the logs.

---

## 4. Release / recycle a group (client churn or campaign end)

1. `echo '{"request":{"client":"<client>","market":"<Market>","group_id":"<id>"},"today":"<YYYY-MM-DD>"}' | node scripts/pool_allocate.mjs release -`
2. Apply the returned updates to every DOMAINS + MAILBOXES row of the group: `assigned_client = pool`, `status = quarantined`, append the `prior_use` entry to `prior_use_history`. Note the `cooldown_until` (today + 90d).
3. **Re-warm** the group before any reuse (via the inbox-manager skill for the locked sending platform, or that platform's own warmup surface); it stays blocked from same-market reassignment until the cooldown clears (`pool_allocate.mjs find` enforces this automatically).
4. If it can't be cleanly recycled (burned/blacklisted per the deliverability rules), set `status = retired` instead.
5. Write the logs.

---

## Refresh the DASHBOARD alerts anytime

`readSpreadsheet` DOMAINS + MAILBOXES → `node scripts/pool_alerts.mjs payload.json` → write `same_market_conflicts`, expiry, auto-renew anomalies, burn, and ready-&-unassigned back to the DASHBOARD's script-populated cells. Run `pool_warmth.mjs` on the MAILBOXES rows to advance `warming → ready` and refresh `last_health_check`.
