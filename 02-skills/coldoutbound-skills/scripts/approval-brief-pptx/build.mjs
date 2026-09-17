// Generic runner: build a client's full approval-brief deck.
// Usage:  node build.mjs <client> "<output.pptx>"
//   <client>  resolves ./<client>.mjs  (must export { meta, buildSlides })
import { createBrief } from "./lib.mjs";

const client = process.argv[2];
const out = process.argv[3];
if (!client) { console.error("usage: node build.mjs <client> <output.pptx>"); process.exit(1); }

const mod = await import(`./${client}.mjs`);
const b = createBrief(mod.meta);
for (const thunk of mod.buildSlides(b)) thunk();
const path = await b.save(out || mod.meta.defaultOut);
console.log("WROTE", path);
