# Archived 2026-09-22: no-AI-API rule

Operator directive 2026-09-22: the cold-outbound flow makes no third-party AI API calls. The only AI is Claude Code itself (the session, its sub-agents, the `/deep-research` harness, and its built-in WebSearch/WebFetch). The one exception is OpenAI sender headshots (`generate_inbox_profiles.py`, which stays in `scripts/`).

These scripts existed only to call AI provider APIs (Perplexity, Grok/xAI, OpenAI, DeepSeek, MiniMax, and the Claude API by key), so they were moved here rather than rewritten. Nothing in the live skills calls them. Real API keys in `scripts/.env` were not touched.

| File | What it did |
|---|---|
| `scripts/research/ai_router.mjs` | Multi-provider AI router (Perplexity, Grok, OpenAI, DeepSeek, MiniMax, Claude API) |
| `scripts/research/dr_harvest.mjs` | Deep-research harvest built on `ai_router.mjs` |
| `scripts/research/perplexity_routing_check.mjs` | Checked that Perplexity-routed research ran |
| `scripts/linkedin_find_web.mjs` | LinkedIn URL lookup through the OpenAI API |
| `scripts/pplx_research.mjs` | Perplexity research helper (A-Sales only) |

To restore one, move it back to the same relative path under `scripts/`.
