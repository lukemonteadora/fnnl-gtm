// Zero-Clay-credit guard (PreToolUse hook). Operator HARD RULE, 2026-09-22.
//
// FNNL never runs anything in Clay that consumes Clay credits. The full rule is
// in outbound/stack-contract.yaml at lead_data.list_workbench.credit_policy_rule
// (clause 6: the only Clay MCP calls a session may make are free metadata and
// read calls). This hook enforces that clause for Claude Code itself:
//
//   1. On the Clay connector, DEFAULT-DENY: only the free read calls in
//      FREE_READ pass. Any other tool, including one Clay adds later, is blocked.
//   2. On ANY server, the known Clay credit-spending tool names are blocked, so a
//      reconnect under a new connector id is still caught.
//
// It is a backstop, not the whole rule. It cannot see columns run inside the
// Clay web app, and a reconnect that changes BOTH the connector id and every
// tool name would slip past it. Update CLAY_SERVER_IDS when the connector id
// changes (read it from the tool names, mcp__<id>__get-current-workspace).
//
// Test without Claude Code:
//   echo '{"tool_name":"mcp__<id>__run_subroutine"}' | node .claude/hooks/clay-credit-guard.mjs

const CLAY_SERVER_IDS = new Set([
  '6f92ce0c-92ee-412c-8734-2c3d04e774d8', // claude.ai Clay connector, workspace Dorsia Labs 651677
]);

// Free metadata and read calls (credit_policy_rule clause 6).
const FREE_READ = new Set([
  'get-current-workspace',
  'list_subroutines',
  'get-task',
  'get-task-context',
]);

// Clay connector tools that spend credits or whose billing is unverified
// (clause 4: unproven means denied). Matched by exact name on any server.
const CREDIT_TOOLS = new Set([
  'search-companies',
  'search-contacts',
  'search-contacts-by-name',
  'load-more-search-results',
  'render-search-results',
  'find-and-enrich-company',
  'find-and-enrich-contacts-at-company',
  'find-and-enrich-list-of-contacts',
  'add-company-data-points',
  'add-contact-data-points',
  'run_subroutine',
  'run_subroutine_direct',
  'ask-question-about-accounts',
  'query-objects',
]);

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

function decide(toolName) {
  if (typeof toolName !== 'string' || !toolName.startsWith('mcp__')) return null;
  const rest = toolName.slice('mcp__'.length);
  const sep = rest.indexOf('__');
  if (sep === -1) return null;
  const server = rest.slice(0, sep);
  const tool = rest.slice(sep + 2);

  const isClay = CLAY_SERVER_IDS.has(server) || /clay/i.test(server);
  if (isClay && FREE_READ.has(tool)) return null;
  if (isClay) {
    return `Blocked by the zero-Clay-credit HARD RULE (CLAUDE.md section 7, stack-contract.yaml lead_data.list_workbench.credit_policy_rule). "${tool}" is not one of the free Clay read calls (${[...FREE_READ].join(', ')}), so it is treated as credit-consuming. Get this data from FNNL's own keyed tools outside Clay and push the rows into the client's Clay table by webhook (scripts/workbench_push.mjs). Only a new explicit operator directive changes this rule.`;
  }
  if (CREDIT_TOOLS.has(tool) || tool.startsWith('find-and-enrich-')) {
    return `Blocked by the zero-Clay-credit HARD RULE: "${tool}" on server "${server}" matches a known Clay credit-spending tool name. If this server is genuinely not Clay, edit CREDIT_TOOLS in .claude/hooks/clay-credit-guard.mjs with the operator's approval.`;
  }
  return null;
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    // The matcher only routes Clay-shaped tool names here, so fail closed.
    deny('Zero-Clay-credit guard could not read the hook input, so the call is blocked (fail closed). Check .claude/hooks/clay-credit-guard.mjs.');
  }
  const reason = decide(input && input.tool_name);
  if (reason) deny(reason);
  process.exit(0);
});
