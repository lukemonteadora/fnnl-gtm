#!/usr/bin/env node
// perplexity_routing_check.mjs — DEPRECATED (operator directive 2026-07-02).
//
// The primary research engine is no longer Perplexity; it is the Claude native /deep-research
// fan-out harness. This checker used to FLAG any research run with no logged Perplexity call — which
// under the new default (research_routing = claude_deep_research) would flag EVERY run, since a
// compliant run now logs a /deep-research primary, not a Perplexity one.
//
// This file is kept only as a forwarding shim so old references don't break. It delegates to
// research_routing_check.mjs (which passes a run that logged EITHER a Claude /deep-research primary
// OR — under an explicit third_party_ai opt-out — a Perplexity primary). Update your references to
// call research_routing_check.mjs directly.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.stderr.write('[deprecated] perplexity_routing_check.mjs → forwarding to research_routing_check.mjs (see /ai-model-routing)\n');
const target = path.resolve(__dirname, 'research_routing_check.mjs');
const r = spawnSync(process.execPath, [target, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status === null ? 1 : r.status);
