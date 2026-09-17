#!/usr/bin/env node
// pool_cutover.mjs — thread-aware cutover check for /mailbox-pool-staging stage promotion.
//
// When promoting Stage 1 (.co) -> Stage 2 (.com) -> Stage 3 (branded): new sends move to the new domains,
// but the OLD-stage mailboxes must keep running until their in-flight conversations finish, so no sequence
// or reply thread is dropped. This tool answers "is it safe to retire the old-stage mailboxes yet?"
//
// DETECTION ONLY — the operator confirms the retire. The agent pulls the OLD-stage campaign's leads via the
// smartlead MCP (smartlead_list_leads_by_campaign for status; smartlead_fetch_lead_message_history /
// smartlead_fetch_lead_categories for replies) and pipes them here.
//
// safe_to_retire = no lead still progressing through the sequence AND no replied lead left unanswered.
//
// CAVEAT — the INFLIGHT status values + CLOSED reply categories below are best-effort defaults. Before the
// FIRST real Stage 1->2 (or 2->3) retire, pull one live campaign's lead objects (smartlead_list_leads_by_campaign
// for status, smartlead_fetch_lead_categories / message history for replies) and confirm the actual enum
// strings Smartlead returns; widen the sets if they differ. The safe failure direction is over-HOLDING (you
// wait longer before retiring), never early retire — so when unsure, a value NOT in INFLIGHT/CLOSED counts
// against "safe": unknown statuses are ignored, but any replied lead whose category isn't a known CLOSED one
// is treated as still-open. Re-confirm the enums when Smartlead changes them.
//
// Usage:
//   node pool_cutover.mjs payload.json           # or: ... - < payload.json
//   payload: { leads:[ {email, status, category?, has_reply?|reply_count?, ...}, ... ] }

import { loadPayload, out } from './pool_lib.mjs';

// Lead is still being sent to (mid-sequence) — keep the old mailbox alive.
const INFLIGHT = new Set(['INPROGRESS', 'IN_PROGRESS', 'STARTED', 'RESUMED', 'SCHEDULED', 'NOT_STARTED', 'NOTSTARTED']);
// Reply categories that mean the conversation is closed (safe to stop sending from this mailbox).
const CLOSED = new Set(['not interested', 'do not contact', 'out of office', 'wrong person', 'bounced',
  'unsubscribed', 'closed', 'meeting booked', 'won', 'lost']);

const status = (l) => String(l.status ?? l.lead_status ?? '').toUpperCase().replace(/\s+/g, '_');
const replied = (l) => Boolean(l.has_reply || l.is_replied || (l.reply_count && Number(l.reply_count) > 0));
const category = (l) => String(l.category ?? l.lead_category ?? '').trim().toLowerCase();
const email = (l) => l.email || l.lead_email || l.to || '';

function run(p) {
  const leads = p.leads || [];
  const inflight = leads.filter((l) => INFLIGHT.has(status(l)));
  const unanswered = leads.filter((l) => replied(l) && !CLOSED.has(category(l)));
  const safe = inflight.length === 0 && unanswered.length === 0;
  return {
    safe_to_retire: safe,
    leads_seen: leads.length,
    in_flight_count: inflight.length,
    unanswered_reply_count: unanswered.length,
    detail: {
      in_flight: inflight.slice(0, 50).map(email).filter(Boolean),
      unanswered: unanswered.slice(0, 50).map(email).filter(Boolean),
    },
    note: safe
      ? 'No in-flight sequences or open replies on the old-stage mailboxes. Operator can confirm retire.'
      : 'Hold the retire: let the in-flight sequences + open reply threads finish on the old-stage mailboxes first. Re-run after they clear.',
  };
}

const [path] = process.argv.slice(2);
out(run(loadPayload(path)));
