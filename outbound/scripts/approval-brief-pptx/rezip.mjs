// Normalize a pptxgenjs-written .pptx so strict Office builds will open it.
// pptxgenjs (via JSZip) emits explicit directory entries and does not force
// [Content_Types].xml first; PowerPoint's OPC reader rejects that ("could not
// open the file"). This is the Windows equivalent of the pptx skill's rezip.py.
// Run:  node rezip.mjs <in.pptx> <out.pptx>   (out may equal in)
import fs from "node:fs";
import JSZip from "jszip";

const [src, dst] = process.argv.slice(2);
if (!src || !dst) { console.error("usage: node rezip.mjs <in.pptx> <out.pptx>"); process.exit(1); }

const zin = await JSZip.loadAsync(fs.readFileSync(src));
const names = Object.keys(zin.files).filter((n) => !zin.files[n].dir); // drop dir entries
names.sort((a, b) => (a === "[Content_Types].xml" ? -1 : b === "[Content_Types].xml" ? 1 : 0)); // content-types first

const zout = new JSZip();
for (const n of names) zout.file(n, await zin.files[n].async("nodebuffer"));
const out = await zout.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 }, platform: "UNIX" });
fs.writeFileSync(dst, out);
console.log("REZIPPED", names.length, "entries ->", dst);
