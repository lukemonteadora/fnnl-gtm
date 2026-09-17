/*
 * _mcp_stdio_lib.mjs — minimal, DEPENDENCY-FREE Model Context Protocol (MCP) server over stdio.
 *
 * Why hand-rolled: every script in this repo uses Node built-ins only (no package.json / node_modules).
 * The MCP stdio transport is just newline-delimited JSON-RPC 2.0 on stdin/stdout, so a basic server
 * needs no SDK. This keeps the GetSales.io / Close.com MCP servers dep-free and clone-friendly.
 *
 * Scope: implements initialize, notifications/initialized, tools/list, tools/call, ping. Enough to
 * expose a handful of tools to an MCP client. NOT a full SDK (no resources/prompts/sampling). "Basic,
 * optimize later" per the operator directive.
 *
 * Usage (in a server file):
 *   import { runStdioServer } from './_mcp_stdio_lib.mjs';
 *   runStdioServer({
 *     name: 'close', version: '0.1.0',
 *     tools: [{
 *       name: 'close_search_leads',
 *       description: '...',
 *       inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
 *       handler: async (args) => ({ text: JSON.stringify(result) }),  // return {text} or {text,isError}
 *     }],
 *   });
 *
 * Smoke test:  node _mcp_stdio_lib.mjs --selftest   (defines a `ping` tool, then read JSON-RPC on stdin)
 */

import { createInterface } from 'node:readline';

const PROTOCOL_VERSION = '2024-11-05';

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}
function result(id, res) { send({ jsonrpc: '2.0', id, result: res }); }
function error(id, code, message) { send({ jsonrpc: '2.0', id, error: { code, message } }); }

export function runStdioServer({ name, version, tools }) {
  const toolList = tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
  const byName = new Map(tools.map((t) => [t.name, t]));

  const rl = createInterface({ input: process.stdin, terminal: false });
  rl.on('line', async (line) => {
    const s = line.trim();
    if (!s) return;
    let msg;
    try { msg = JSON.parse(s); } catch { return error(null, -32700, 'Parse error'); }
    const { id, method, params } = msg;

    // notifications (no id) — never reply
    if (id === undefined || id === null) {
      // e.g. notifications/initialized — accept silently
      return;
    }

    try {
      if (method === 'initialize') {
        return result(id, {
          protocolVersion: params?.protocolVersion || PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name, version },
        });
      }
      if (method === 'ping') return result(id, {});
      if (method === 'tools/list') return result(id, { tools: toolList });
      if (method === 'tools/call') {
        const tool = byName.get(params?.name);
        if (!tool) return error(id, -32602, `Unknown tool: ${params?.name}`);
        try {
          const out = await tool.handler(params?.arguments || {});
          const text = typeof out === 'string' ? out : out?.text ?? JSON.stringify(out ?? {});
          return result(id, { content: [{ type: 'text', text }], isError: !!out?.isError });
        } catch (e) {
          // Tool failures are returned as tool-level errors, not protocol errors.
          return result(id, { content: [{ type: 'text', text: `Error: ${e?.message || e}` }], isError: true });
        }
      }
      return error(id, -32601, `Method not found: ${method}`);
    } catch (e) {
      return error(id, -32603, `Internal error: ${e?.message || e}`);
    }
  });

  // Announce on stderr so it never corrupts the stdout JSON-RPC stream.
  process.stderr.write(`[mcp:${name}] stdio server ready (${toolList.length} tools)\n`);
}

// --- self-test server: node _mcp_stdio_lib.mjs --selftest ---
if (process.argv[1] && process.argv[1].endsWith('_mcp_stdio_lib.mjs') && process.argv.includes('--selftest')) {
  runStdioServer({
    name: 'selftest',
    version: '0.0.0',
    tools: [{
      name: 'ping',
      description: 'Echo back the provided message.',
      inputSchema: { type: 'object', properties: { message: { type: 'string' } } },
      handler: async (args) => ({ text: `pong: ${args.message ?? ''}` }),
    }],
  });
}
