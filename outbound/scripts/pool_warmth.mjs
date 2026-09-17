#!/usr/bin/env node
// pool_warmth.mjs — days-warmed + ready-flag calculator for /mailbox-pool-staging.
//
// PURE logic. The agent pulls warmup status/health per mailbox via the smartlead MCP
// (smartlead_get_warmup_stats_by_email_account_id / smartlead_analytics_mailbox_name_wise_health_metrics
// / GET /email-accounts) and the MAILBOXES rows from the sheet, then pipes them here. This tool codifies
// the SINGLE deliverability ready gate so it can never drift: ready = warmed >= 21 days AND health "good"
// AND connected to Smartlead. (Mirrors /smartlead-campaign-upload-public + /smartlead-inbox-manager.)
//
// Usage:
//   node pool_warmth.mjs payload.json            # or: ... - < payload.json
//   payload: { mailboxes:[ {handle, warmup_start_date, warmup_health, in_smartlead, status, ...}, ... ], today? }
//
// Output: per-mailbox { days_warmed, ready, suggested_status, transition } + a roll-up, for the agent to
// write back into MAILBOXES (days_warmed is a sheet formula, but this echoes it for verification + status moves).

import { asRecords, daysBetween, isMailboxReady, loadPayload, out, MAILBOX_COLUMNS, READY_WARMUP_DAYS } from './pool_lib.mjs';

function run(p) {
  const today = p.today;
  const M = asRecords(p.mailboxes, MAILBOX_COLUMNS);
  const updates = M.map((mb) => {
    const dw = daysBetween(mb.warmup_start_date, today);
    const ready = isMailboxReady(mb, today);
    let suggested = mb.status;
    if (mb.status === 'provisioning' && String(mb.in_smartlead).toUpperCase() === 'Y') suggested = 'warming';
    if (mb.status === 'warming' && ready) suggested = 'ready';
    return {
      handle: mb.handle,
      group_id: mb.group_id,
      days_warmed: dw,
      warmup_health: mb.warmup_health,
      ready: ready ? 'Y' : 'N',
      current_status: mb.status,
      suggested_status: suggested,
      transition: suggested !== mb.status,
    };
  });
  return {
    ready_gate_days: READY_WARMUP_DAYS,
    count: updates.length,
    ready_count: updates.filter((u) => u.ready === 'Y').length,
    pending_transitions: updates.filter((u) => u.transition),
    updates,
  };
}

const [path] = process.argv.slice(2);
out(run(loadPayload(path)));
