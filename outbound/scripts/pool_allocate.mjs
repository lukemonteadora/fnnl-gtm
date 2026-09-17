#!/usr/bin/env node
// pool_allocate.mjs — allocation + isolation gate, and release -> quarantine, for /mailbox-pool-staging.
//
// PURE logic over records the agent reads from the "Cold Email Mailbox Pool" sheet (DOMAINS + MAILBOXES).
// No network. Enforces the STEP-3 isolation rules:
//   1. One active client per group  — only groups whose mailboxes are unassigned (assigned_client = "pool").
//   2. Same-market isolation        — block a NEW client into a market already held by a DIFFERENT deployed
//                                      client (prospect-pool overlap + sender-identity confusion).
//   3. Recycle cooldown             — a group whose mailboxes were released by a DIFFERENT client in the SAME
//                                      market < COOLDOWN_DAYS (90) ago is blocked until the cooldown clears.
//   4. Ready-only                   — every mailbox in the group must clear the 21-day warmup ready gate.
//
// Usage (loads JSON from a file path or '-' for stdin):
//   node pool_allocate.mjs find    payload.json
//   node pool_allocate.mjs release payload.json
//
//   find payload:    { request:{client, market, stage}, mailboxes:[...], domains:[...],
//                      today?, cooldown_days?, allow_same_market? }
//   release payload: { request:{client, market, group_id}, today? }
//
// Output: JSON decision. find -> { eligible_groups, blocked_groups, market_conflict, recommendation,
// provision_fresh }. release -> the field updates the agent writes back to the sheet (quarantine + cooldown).

import {
  asRecords, parsePriorUse, daysBetween, isMailboxReady, loadPayload, out, addDays, norm,
  DOMAIN_COLUMNS, MAILBOX_COLUMNS, COOLDOWN_DAYS,
} from './pool_lib.mjs';

// A market is "held" by a non-pool client once a group is assigned to them and is live OR coming live —
// not just when already deployed — so a second client can't be slotted into a market mid-warmup.
const HELD_STATUSES = ['warming', 'ready', 'deployed'];

function find(p) {
  const today = p.today;
  const cooldown = p.cooldown_days ?? COOLDOWN_DAYS;
  const req = p.request || {};
  const stage = String(req.stage ?? '1');
  const market = req.market || '';
  const client = req.client || '';
  const M = asRecords(p.mailboxes, MAILBOX_COLUMNS);

  if (!client || !market) {
    return { error: 'request.client and request.market are required' };
  }

  // Guard 2 — same-market isolation: is this market already held by a DIFFERENT deployed client?
  const occupiedByOther = [...new Set(M
    .filter((mb) => norm(mb.market) === norm(market)
      && HELD_STATUSES.includes(String(mb.status))
      && mb.assigned_client && norm(mb.assigned_client) !== 'pool' && norm(mb.assigned_client) !== norm(client))
    .map((mb) => mb.assigned_client))];
  const marketConflict = occupiedByOther.length > 0;

  // Candidate groups at the requested stage that are unassigned (pool inventory).
  const groupIds = [...new Set(M
    .filter((mb) => String(mb.stage) === stage && (norm(mb.assigned_client) === 'pool' || !mb.assigned_client))
    .map((mb) => mb.group_id))].filter(Boolean);

  const eligible = [];
  const blocked = [];
  for (const g of groupIds) {
    const gmb = M.filter((mb) => mb.group_id === g);
    const readyCount = gmb.filter((mb) => isMailboxReady(mb, today)).length;
    const allReady = gmb.length > 0 && readyCount === gmb.length;
    const cooldownHit = gmb.flatMap((mb) => parsePriorUse(mb.prior_use_history))
      .filter((pu) => norm(pu.market) === norm(market) && norm(pu.client) !== norm(client)
        && pu.released && daysBetween(pu.released, today) !== null && daysBetween(pu.released, today) < cooldown);
    const rec = { group_id: g, mailboxes: gmb.length, ready: readyCount };
    if (!allReady) blocked.push({ ...rec, reason: `not all warmed/ready (${readyCount}/${gmb.length} clear the 21-day gate)` });
    else if (cooldownHit.length) blocked.push({ ...rec, reason: `same-market cooldown active (released by another client < ${cooldown}d ago)` });
    else eligible.push(rec);
  }

  // Recommendation.
  let recommendation, provisionFresh = false;
  if (marketConflict && !p.allow_same_market) {
    recommendation = `BLOCKED — market "${market}" is already active for ${occupiedByOther.join(', ')}. Isolate (use a different market group, or run a different angle), and dedup/suppress prospect lists at the Clay/list level. Pass allow_same_market:true only if you have explicitly decided to run two clients in this market.`;
  } else if (eligible.length) {
    const pick = eligible.sort((a, b) => a.mailboxes - b.mailboxes)[0]; // smallest sufficient group
    recommendation = `Assign group ${pick.group_id} (${pick.mailboxes} mailboxes, all ready) to ${client}; launch immediately.`;
  } else {
    provisionFresh = true;
    recommendation = `No ready, isolation-clean Stage-${stage} group in the pool. Provision a fresh ${stage === '1' ? '.co Stage-1' : 'Stage-' + stage} group via the provisioning flow and warm it.`;
  }

  return {
    request: { client, market, stage },
    market_conflict: marketConflict ? { market, active_clients: occupiedByOther } : null,
    eligible_groups: marketConflict && !p.allow_same_market ? [] : eligible,
    blocked_groups: blocked,
    provision_fresh: provisionFresh,
    recommendation,
  };
}

function release(p) {
  const today = p.today || new Date().toISOString().slice(0, 10);
  const req = p.request || {};
  if (!req.group_id || !req.client || !req.market) {
    return { error: 'release needs request.group_id, request.client, request.market' };
  }
  const priorUse = { client: req.client, market: req.market, released: today };
  return {
    action: 'release',
    group_id: req.group_id,
    cooldown_until: addDays(today, COOLDOWN_DAYS),
    // The agent applies these to every domain + mailbox row of the group in the sheet:
    mailbox_updates: { assigned_client: 'pool', status: 'quarantined', append_prior_use: priorUse },
    domain_updates: { assigned_client: 'pool', status: 'quarantined' },
    next: `Re-warm the group before reuse. Isolation blocks same-market reuse until ${addDays(today, COOLDOWN_DAYS)}. If it can't be cleanly recycled, set status = retired.`,
  };
}

const [cmd, path] = process.argv.slice(2);
if (cmd === 'find') out(find(loadPayload(path)));
else if (cmd === 'release') out(release(loadPayload(path)));
else { console.error('Usage: node pool_allocate.mjs find|release <payload.json|->'); process.exit(2); }
