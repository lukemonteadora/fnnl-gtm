// infra-digest-appsscript.gs — Apps Script functions for the monthly infra-spend Slack digest.
// Lives in the Cold Email Mailbox Tracker's bound Apps Script project (same project as the inbox writer).
// Reads the tracker server-side (no token expiry), posts to Slack via a token kept ONLY in Script Properties.
//
// Functions:
//   computeInfra_()        - pure compute: run-rate + cash-this-month from the Costs tab + client tabs. No I/O side effects.
//   postInfraSpendDigest() - composes the Slack message and POSTS it (needs SLACK_BOT_TOKEN + INFRA_CHANNEL props).
//   infraDigestDryRun()    - logs the computed numbers WITHOUT posting (no token needed) — for verification.
//   setupInfraDigest()     - sets INFRA_CHANNEL (channel id, not a secret) + installs the monthly (1st, 08:00) trigger.
//
// SLACK_BOT_TOKEN must be set in Script Properties by the operator (a token cannot be entered by the assistant).

function computeInfra_() {
  var SS_ID = '<MAILBOX_TRACKER_SHEET_ID>';
  var ss = SpreadsheetApp.openById(SS_ID);
  // Costs tab = the sheet whose name contains 'Costs' (avoids emoji matching)
  var costs = null, sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) { if (sheets[s].getName().indexOf('Costs') >= 0) { costs = sheets[s]; break; } }
  if (!costs) throw new Error('Costs tab not found');
  var grid = costs.getDataRange().getValues();
  function num(v) { v = (typeof v === 'number') ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(v) ? 0 : v; }
  // rate card: domain $/yr (row whose A contains 'Domain $/yr')
  var domYr = 8.88;
  for (var r = 0; r < grid.length; r++) { if (String(grid[r][0]).toLowerCase().indexOf('domain $/yr') >= 0) { domYr = num(grid[r][1]) || 8.88; break; } }
  // per-client rows under the 'Client' header
  var hRow = -1;
  for (var r2 = 0; r2 < grid.length; r2++) { if (String(grid[r2][0]).trim().toLowerCase() === 'client') { hRow = r2; break; } }
  if (hRow < 0) throw new Error('Client header not found in Costs');
  var clients = [], tot = { mbx: 0, mbxCost: 0, dom: 0, domCost: 0, server: 0, monthly: 0 };
  for (var i = hRow + 1; i < grid.length; i++) {
    var name = String(grid[i][0] || '').trim(); if (!name) continue;
    var row = { name: name, mbx: num(grid[i][1]), mbxCost: num(grid[i][2]), dom: num(grid[i][3]), domCost: num(grid[i][4]), server: num(grid[i][6]), monthly: num(grid[i][7]) };
    clients.push(row);
    tot.mbx += row.mbx; tot.mbxCost += row.mbxCost; tot.dom += row.dom; tot.domCost += row.domCost; tot.server += row.server; tot.monthly += row.monthly;
  }
  // cash this month: distinct domains whose Created Date (col C) is in the current calendar month, across client tabs
  var now = new Date(); var ym = now.getFullYear() + '-' + now.getMonth();
  var newDomains = {};
  for (var sh = 0; sh < sheets.length; sh++) {
    var w = sheets[sh];
    if (String(w.getRange('A1').getValue() || '').trim().toLowerCase() !== 'mailbox') continue; // client inventory tabs only
    var lr = w.getLastRow(); if (lr < 2) continue;
    var vals = w.getRange(2, 2, lr - 1, 2).getValues(); // B=domain, C=created date
    for (var v = 0; v < vals.length; v++) {
      var dom = String(vals[v][0] || '').trim().toLowerCase(); var d = vals[v][1];
      if (!dom) continue;
      if (d instanceof Date && (d.getFullYear() + '-' + d.getMonth()) === ym) newDomains[dom] = true;
    }
  }
  var newDomCount = Object.keys(newDomains).length;
  return {
    clients: clients, tot: tot, domYr: domYr,
    newDomCount: newDomCount,
    newDomCash: newDomCount * domYr,          // one-time domain registrations paid this month
    recurringCash: tot.mbxCost + tot.server,  // mailboxes + servers bill monthly
    runRate: tot.monthly,                     // mailboxes + domains(amortized) + servers per month
    now: now
  };
}

function money_(n) { return '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function infraBlocks_(d) {
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var title = 'Cold Email Infrastructure — ' + months[d.now.getMonth()] + ' ' + d.now.getFullYear();
  function pad(s, w, right) { s = String(s); if (s.length > w) s = s.slice(0, w); var sp = ' '.repeat(Math.max(0, w - s.length)); return right ? sp + s : s + sp; }
  var lines = [pad('Client', 14) + ' ' + pad('Mbx', 4, true) + '  ' + pad('Dom', 4, true) + '  ' + pad('Monthly', 10, true)];
  for (var i = 0; i < d.clients.length; i++) { var c = d.clients[i]; lines.push(pad(c.name, 14) + ' ' + pad(c.mbx, 4, true) + '  ' + pad(c.dom, 4, true) + '  ' + pad(money_(c.monthly), 10, true)); }
  lines.push(pad('TOTAL', 14) + ' ' + pad(d.tot.mbx, 4, true) + '  ' + pad(d.tot.dom, 4, true) + '  ' + pad(money_(d.tot.monthly), 10, true));
  var blocks = [
    { type: 'header', text: { type: 'plain_text', text: '📊 ' + title, emoji: true } },
    { type: 'section', text: { type: 'mrkdwn', text: '*What the live email infrastructure costs right now (monthly run-rate):* ' + money_(d.runRate) + ' /mo\n• Mailboxes: ' + money_(d.tot.mbxCost) + ' /mo  (' + d.tot.mbx + ' mailboxes)\n• Domains: ' + money_(d.tot.domCost) + ' /mo  (' + d.tot.dom + ' domains, annual cost spread over the year)\n• Servers: ' + money_(d.tot.server) + ' /mo' } },
    { type: 'section', text: { type: 'mrkdwn', text: '*Cash actually going out this month:*\n• New domains registered this month: ' + money_(d.newDomCash) + '  (' + d.newDomCount + ' domains × ' + money_(d.domYr) + ')\n• Recurring mailbox + server bills: ' + money_(d.recurringCash) + ' /mo' } },
    { type: 'section', text: { type: 'mrkdwn', text: '```' + lines.join('\n') + '```' } },
    { type: 'context', elements: [{ type: 'mrkdwn', text: 'Auto-posted on the 1st from the Cold Email Mailbox Tracker. Run-rate = ongoing monthly cost to keep the infra; cash this month = money actually leaving this month.' }] }
  ];
  return { title: title, blocks: blocks };
}

function postInfraSpendDigest() {
  var props = PropertiesService.getScriptProperties();
  var TOKEN = props.getProperty('SLACK_BOT_TOKEN');
  var CHANNEL = props.getProperty('INFRA_CHANNEL');
  if (!TOKEN) throw new Error('SLACK_BOT_TOKEN is not set in Script Properties — the operator must add it (Project Settings → Script Properties).');
  if (!CHANNEL) throw new Error('INFRA_CHANNEL is not set — run setupInfraDigest() first.');
  var d = computeInfra_();
  var m = infraBlocks_(d);
  var resp = UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', {
    method: 'post', contentType: 'application/json; charset=utf-8',
    headers: { Authorization: 'Bearer ' + TOKEN },
    payload: JSON.stringify({ channel: CHANNEL, text: m.title, blocks: m.blocks }),
    muteHttpExceptions: true
  });
  var body = JSON.parse(resp.getContentText());
  if (!body.ok) throw new Error('Slack error: ' + body.error);
  Logger.log('INFRA DIGEST posted to ' + CHANNEL + ' | run-rate ' + money_(d.runRate) + ' | new-domain cash ' + money_(d.newDomCash) + ' (' + d.newDomCount + ') | recurring ' + money_(d.recurringCash));
  return body;
}

function infraDigestDryRun() {
  var d = computeInfra_();
  Logger.log('INFRA DRY-RUN — run-rate(monthly): ' + money_(d.runRate)
    + ' = mailboxes ' + money_(d.tot.mbxCost) + ' (' + d.tot.mbx + ') + domains ' + money_(d.tot.domCost) + ' (' + d.tot.dom + ') + servers ' + money_(d.tot.server));
  Logger.log('INFRA DRY-RUN — cash this month: new domains ' + money_(d.newDomCash) + ' (' + d.newDomCount + ' × ' + money_(d.domYr) + ') + recurring mbx+server ' + money_(d.recurringCash));
  Logger.log('INFRA DRY-RUN — clients: ' + d.clients.map(function (c) { return c.name + '(' + c.mbx + 'mbx,' + money_(c.monthly) + ')'; }).join(', '));
  return d;
}

function setupInfraDigest() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('INFRA_CHANNEL', '<INFRA_CHANNEL_ID>'); // #cold-email-infra-spend (channel id is not a secret)
  var trs = ScriptApp.getProjectTriggers();
  for (var i = 0; i < trs.length; i++) { if (trs[i].getHandlerFunction() === 'postInfraSpendDigest') ScriptApp.deleteTrigger(trs[i]); }
  ScriptApp.newTrigger('postInfraSpendDigest').timeBased().onMonthDay(1).atHour(8).create();
  Logger.log('INFRA SETUP: INFRA_CHANNEL=<INFRA_CHANNEL_ID> set; monthly trigger installed (day 1, ~08:00). SLACK_BOT_TOKEN still required in Script Properties before the first post.');
}
