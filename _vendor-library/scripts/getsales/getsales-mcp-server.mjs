#!/usr/bin/env node
/*
 * getsales-mcp-server.mjs — BASIC dep-free local MCP server for GetSales.io (key-only, scriptable).
 *
 * For full coverage / conversational use, prefer GetSales' OFFICIAL hosted MCP:
 *   https://mcp.getsales.io  (OAuth — add via Claude Settings -> Connectors -> Add custom connector).
 * This local server is the offline / no-OAuth option; it wraps the verified REST client (getsales.mjs)
 * and exposes a handful of core tools. Auth via GETSALES_API_KEY (Bearer JWT). Live-untested (no account yet).
 *
 * Run (MCP client config):  node outbound/scripts/mcp/getsales-mcp-server.mjs
 */
import { runStdioServer } from './_mcp_stdio_lib.mjs';
import { gsReq } from '../getsales.mjs';

const j = (v) => ({ text: JSON.stringify(v) });

runStdioServer({
  name: 'getsales',
  version: '0.1.0',
  tools: [
    { name: 'getsales_me', description: 'Current user / workspace (auth + connectivity check).',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => j(await gsReq('GET', '/id/api/users/current')) },
    { name: 'getsales_list_flows', description: 'List flows (campaigns / sequences).',
      inputSchema: { type: 'object', properties: { limit: { type: 'number' }, offset: { type: 'number' } } },
      handler: async (a) => j(await gsReq('GET', `/flows/api/flows?limit=${a.limit ?? 20}&offset=${a.offset ?? 0}`)) },
    { name: 'getsales_search_leads', description: 'Search leads. Pass a filter/pagination object as `body`.',
      inputSchema: { type: 'object', properties: { body: { type: 'object' } } },
      handler: async (a) => j(await gsReq('POST', '/leads/api/leads/search', a.body ?? {})) },
    { name: 'getsales_list_senders', description: 'List sender profiles.',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => j(await gsReq('GET', '/flows/api/sender-profiles')) },
    { name: 'getsales_upsert_lead', description: 'Create / import a contact. Pass the lead object as `body`.',
      inputSchema: { type: 'object', properties: { body: { type: 'object' } }, required: ['body'] },
      handler: async (a) => j(await gsReq('POST', '/leads/api/leads/upsert', a.body ?? {})) },
    { name: 'getsales_add_lead_to_flow', description: 'Add a lead to a flow. Needs `flowUuid` and a lead `body`.',
      inputSchema: { type: 'object', properties: { flowUuid: { type: 'string' }, body: { type: 'object' } }, required: ['flowUuid'] },
      handler: async (a) => j(await gsReq('POST', `/flows/api/flows/${a.flowUuid}/add-new-lead`, a.body ?? {})) },
  ],
});
