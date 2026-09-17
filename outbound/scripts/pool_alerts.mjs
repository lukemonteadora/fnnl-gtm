#!/usr/bin/env node
// pool_alerts.mjs — dashboard alerts + burn rate + same-market conflict scan for /mailbox-pool-staging.
//
// PURE logic over the DOMAINS + MAILBOXES rows the agent reads from the sheet. Computes the things the
// in-sheet formulas can't (notably distinct-clients-per-market conflicts) plus a full burn/inventory
// summary the agent writes into the DASHBOARD tab (and can post to Slack / the activity log).
//
// Usage:
//   node pool_alerts.mjs payload.json            # or: ... - < payload.json
//   payload: { domains:[...], mailboxes:[...], today?, rate_card?{zapmail_mbx_mo, primeforge_mbx_mo, co_yr, com_yr},
//              expiry_window_days? }
//
// Burn-rate constants default to the existing "Cold Email Mailbox Tracker" rate card so numbers don't drift.

import {
  asRecords, daysUntil, isMailboxReady, norm, round2, out, loadPayload,
  DOMAIN_COLUMNS, MAILBOX_COLUMNS,
} from './pool_lib.mjs';

const DEFAULT_RATE = { zapmail_mbx_mo: 3, primeforge_mbx_mo: 4.5, co_yr: 3.48, com_yr: 8.88 };

function run(p) {
  const today = p.today || new Date().toISOString().slice(0, 10);
  const win = p.expiry_window_days ?? 21;
  const rc = { ...DEFAULT_RATE, ...(p.rate_card || {}) };
  const D = asRecords(p.domains, DOMAIN_COLUMNS).filter((d) => d.domain);
  const M = asRecords(p.mailboxes, MAILBOX_COLUMNS).filter((mb) => mb.handle);

  // Same-market conflict: any market with >= 2 distinct deployed clients.
  const byMarket = {};
  M.filter((mb) => ['warming', 'ready', 'deployed'].includes(String(mb.status)) && mb.assigned_client && norm(mb.assigned_client) !== 'pool')
    .forEach((mb) => { (byMarket[mb.market] = byMarket[mb.market] || new Set()).add(mb.assigned_client); });
  const conflicts = Object.entries(byMarket)
    .filter(([, s]) => s.size > 1)
    .map(([market, s]) => ({ market, clients: [...s] }));

  // Stage-1 .co expiry within the window, and the disposability-rule auto-renew anomaly.
  const expiring = D.filter((d) => norm(d.tld) === 'co' && (() => {
    const du = daysUntil(d.expiry_date, today); return du !== null && du >= 0 && du <= win;
  })()).map((d) => ({ domain: d.domain, expiry_date: d.expiry_date, days_left: daysUntil(d.expiry_date, today) }));
  const autorenewOn = D.filter((d) => norm(d.tld) === 'co' && String(d.auto_renew).toUpperCase() === 'ON')
    .map((d) => d.domain);

  // Burn rate (idle pool cost should always be visible).
  const activeM = M.filter((mb) => String(mb.status) !== 'retired');
  // Pool mailboxes are Zapmail by default (flat rate, Google or Microsoft alike — matches the tracker).
  // If a pool group is ever hosted on PrimeForge, add a vendor column and split the rate here.
  const mailboxBurn = activeM.length * rc.zapmail_mbx_mo;
  const coActive = D.filter((d) => norm(d.tld) === 'co' && String(d.status) !== 'retired').length;
  const comActive = D.filter((d) => norm(d.tld) === 'com' && String(d.status) !== 'retired').length;
  const domainBurn = coActive * rc.co_yr / 12 + comActive * rc.com_yr / 12;

  // Ready & unassigned inventory per stage.
  const readyUnassigned = (s) => M.filter((mb) => String(mb.stage) === s
    && (norm(mb.assigned_client) === 'pool' || !mb.assigned_client)
    && (String(mb.ready).toUpperCase() === 'Y' || isMailboxReady(mb, today))).length;

  // Health-check overdue (> 7 days since last_health_check).
  const overdueHealth = M.filter((mb) => {
    const du = daysUntil(mb.last_health_check, today); return du !== null && -du > 7;
  }).map((mb) => mb.handle);

  return {
    refreshed: today,
    same_market_conflicts: conflicts,
    stage1_expiring: expiring,
    stage1_autorenew_on: autorenewOn,
    burn_rate_usd_mo: { mailbox: round2(mailboxBurn), domain: round2(domainBurn), total: round2(mailboxBurn + domainBurn) },
    ready_unassigned: { stage1: readyUnassigned('1'), stage2: readyUnassigned('2'), stage3: readyUnassigned('3') },
    health_check_overdue: overdueHealth,
    flags: [
      ...(conflicts.length ? [`${conflicts.length} same-market conflict(s) — isolate or dedup lists`] : []),
      ...(autorenewOn.length ? [`${autorenewOn.length} Stage-1 .co domain(s) with auto-renew ON — flip OFF`] : []),
      ...(expiring.length ? [`${expiring.length} Stage-1 .co domain(s) expiring within ${win}d — keep-or-drop`] : []),
    ],
  };
}

const [path] = process.argv.slice(2);
out(run(loadPayload(path)));
