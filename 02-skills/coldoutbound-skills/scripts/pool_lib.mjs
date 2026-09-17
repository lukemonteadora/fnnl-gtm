#!/usr/bin/env node
// pool_lib.mjs — shared schema + helpers for the /mailbox-pool-staging skill.
//
// PURE logic, no network. The skill (agent) does live I/O — the "Cold Email Mailbox Pool" Google
// Sheet via the google-docs MCP, and Smartlead via the smartlead MCP — then pipes JSON records to the
// pool_*.mjs tools below, which import these contracts. The column order here is the SOURCE-OF-TRUTH
// contract for the sheet's DOMAINS / MAILBOXES tabs; keep it in lockstep with the sheet headers.
//
// Deliverability constants MIRROR /anthropic-skills:cold-email-deliverability + /smartlead-inbox-manager
// + /smartlead-campaign-upload-public (21-day ready gate, ~30/day cap, 15-min per-mailbox gap). Do NOT
// invent new numbers here — change them only when those skills change.

export const READY_WARMUP_DAYS = 21;   // warmup-complete = first warmup day + 21d (launch gate)
export const WARMED_BACKUP_DAYS = 14;  // softer "healthy enough to rest as insurance" mark
export const DAILY_CAP_DEFAULT = 30;   // ~30 sends/day/mailbox (12-min spacing over the 6h window)
export const DAILY_CAP_MAX = 50;       // documented not-to-exceed ceiling (NOT a target; ~30 is the rule)
export const MIN_TIME_GAP_MIN = 15;    // per-mailbox minTimeToWaitInMins HARD RULE
export const COOLDOWN_DAYS = 90;       // same-market recycle cooldown (operator decision 2026-06-22)
export const MAILBOXES_PER_DOMAIN = 2; // locked across the provisioning flow
export const STAGE1_GROUP_DOMAINS = 6; // Stage-1 .co group footprint (operator decision 2026-06-22)
export const STAGE1_GROUP_MAILBOXES = 12;
export const POOL_PROVIDER_SPLIT = { google: 0.7, microsoft: 0.3 }; // pre-warm mix (operator decision)

export const STATUSES = ['provisioning', 'warming', 'ready', 'deployed', 'quarantined', 'retired'];
export const MARKETS = [
  'Healthcare', 'Fintech / Financial Services', 'SaaS / Software', 'Telecom / Utilities / Energy',
  'Crypto / Blockchain', 'Manufacturing / Industrial', 'Legal / Compliance', 'Ecommerce / Retail',
  'Marketing / Agencies', 'Real Estate / Construction', 'Logistics / Supply Chain', 'Education',
  'Hospitality / Travel', 'Professional Services', 'Other',
];

// Column contract — MUST match the sheet header rows exactly (DOMAINS!A1:S1, MAILBOXES!A1:P1).
export const DOMAIN_COLUMNS = [
  'domain', 'tld', 'stage', 'group_id', 'registrar', 'acquisition_date', 'cost_usd', 'expiry_date',
  'auto_renew', 'domain_age_days', 'spf', 'dkim', 'dmarc', 'tracking', 'forwarding', 'dns_ready',
  'assigned_client', 'market', 'status',
];
export const MAILBOX_COLUMNS = [
  'handle', 'parent_domain', 'stage', 'group_id', 'provider', 'in_smartlead', 'warmup_start_date',
  'days_warmed', 'warmup_health', 'daily_cap', 'ready', 'assigned_client', 'market', 'status',
  'prior_use_history', 'last_health_check',
];

export const norm = (s) => String(s ?? '').trim().toLowerCase();
export const round2 = (x) => Math.round(x * 100) / 100;

// rows (2D array, optionally incl. a header row) -> array of record objects keyed by column name.
export function rowsToRecords(rows, columns) {
  if (!rows || !rows.length) return [];
  let body = rows;
  if (String(rows[0][0]).trim() === columns[0]) body = rows.slice(1); // strip header if present
  return body
    .filter((r) => r && String(r[0] ?? '').trim() !== '') // skip empty rows (no key in col A)
    .map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i] ?? ''])));
}

export function recordsToRows(records, columns) {
  return records.map((rec) => columns.map((c) => rec[c] ?? ''));
}

// Accept either a 2D array of sheet rows OR an array of record objects.
export function asRecords(data, columns) {
  if (!data || !data.length) return [];
  if (Array.isArray(data[0])) return rowsToRecords(data, columns);
  return data;
}

// prior_use_history is a compact JSON-array string, e.g.
// '[{"client":"example-co","market":"SaaS / Software","released":"2026-03-01"}]'
export function parsePriorUse(s) {
  if (!s) return [];
  if (Array.isArray(s)) return s;
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
}

export function daysBetween(dateStr, today) { // today - dateStr, in whole days (null if unparseable)
  if (!dateStr) return null;
  const d = new Date(dateStr), t = today ? new Date(today) : new Date();
  if (isNaN(d) || isNaN(t)) return null;
  return Math.floor((t - d) / 86400000);
}

export function daysUntil(dateStr, today) { // dateStr - today (positive = future)
  if (!dateStr) return null;
  const d = new Date(dateStr), t = today ? new Date(today) : new Date();
  if (isNaN(d) || isNaN(t)) return null;
  return Math.ceil((d - t) / 86400000);
}

export function addDays(dateStr, n) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// The single deliverability ready gate, codified once.
export function isMailboxReady(mb, today) {
  const dw = daysBetween(mb.warmup_start_date, today);
  return dw !== null && dw >= READY_WARMUP_DAYS
    && norm(mb.warmup_health) === 'good'
    && String(mb.in_smartlead).toUpperCase() === 'Y';
}

import { readFileSync } from 'node:fs';
export function loadPayload(argPath) {
  const raw = (argPath && argPath !== '-') ? readFileSync(argPath, 'utf8') : readFileSync(0, 'utf8');
  return JSON.parse(raw);
}

export function out(obj) { process.stdout.write(JSON.stringify(obj, null, 2) + '\n'); }
export function arg(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return (i >= 0 && process.argv[i + 1]) ? process.argv[i + 1] : dflt;
}
