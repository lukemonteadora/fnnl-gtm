import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const d = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(d, '.env'), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const K = process.env.AI_ARK_API_KEY;
const r = await fetch('https://api.ai-ark.com/api/developer-portal/v1/payments/credits', { headers: { 'X-TOKEN': K } });
console.log(r.status, (await r.text()).split(K).join('***').slice(0, 300));
