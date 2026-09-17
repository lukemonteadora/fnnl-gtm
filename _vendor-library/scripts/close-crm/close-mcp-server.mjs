#!/usr/bin/env node
/*
 * close-mcp-server.mjs — BASIC dep-free local MCP server for Close CRM (key-only, scriptable).
 *
 * For full coverage / conversational use, prefer Close's OFFICIAL hosted MCP:
 *   https://mcp.close.com/mcp  (HTTP; headers Close-API-Key + Close-Scope). Add it directly:
 *   claude mcp add --scope user --transport http close https://mcp.close.com/mcp \
 *     --header "Close-API-Key: ${CLOSE_API_KEY}" --header "Close-Scope: mcp.read"
 * This local server is the offline option; it wraps the verified REST client (close.mjs) and exposes
 * core tools. Auth via CLOSE_API_KEY (HTTP Basic, key as username). Live-untested (no account yet).
 *
 * Run (MCP client config):  node outbound/scripts/mcp/close-mcp-server.mjs
 */
import { runStdioServer } from './_mcp_stdio_lib.mjs';
import { closeReq } from '../close.mjs';

const j = (v) => ({ text: JSON.stringify(v) });

runStdioServer({
  name: 'close',
  version: '0.1.0',
  tools: [
    { name: 'close_me', description: 'Current user / org (auth + connectivity check).',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => j(await closeReq('GET', '/me/')) },
    { name: 'close_search_leads', description: 'List / search leads. Optional `query` string and `limit`.',
      inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } },
      handler: async (a) => j(await closeReq('GET', `/lead/?_limit=${a.limit ?? 20}${a.query ? `&query=${encodeURIComponent(a.query)}` : ''}`)) },
    { name: 'close_get_lead', description: 'Get a lead by id.',
      inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      handler: async (a) => j(await closeReq('GET', `/lead/${a.id}/`)) },
    { name: 'close_list_opportunities', description: 'List opportunities.',
      inputSchema: { type: 'object', properties: { limit: { type: 'number' } } },
      handler: async (a) => j(await closeReq('GET', `/opportunity/?_limit=${a.limit ?? 20}`)) },
    { name: 'close_search', description: 'Advanced search. Pass a Close data/search JSON filter as `body`.',
      inputSchema: { type: 'object', properties: { body: { type: 'object' } }, required: ['body'] },
      handler: async (a) => j(await closeReq('POST', '/data/search/', a.body ?? {})) },
    { name: 'close_create_lead', description: 'Create a lead. Pass the lead object as `body`.',
      inputSchema: { type: 'object', properties: { body: { type: 'object' } }, required: ['body'] },
      handler: async (a) => j(await closeReq('POST', '/lead/', a.body ?? {})) },
  ],
});
