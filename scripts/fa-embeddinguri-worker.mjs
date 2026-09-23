// `@huggingface/transformers` se servește ca fișier static, nu prin
// Turbopack — din același motiv ca `web-llm` (`fa-model-worker.mjs`): un
// `new Worker(new URL(...))` iese din build ca sursă neatinsă, iar pachetul
// (WASM, ONNX runtime) e prea mare pentru coajă. Modelul de embeddinguri
// (~25 MB) se aduce la rulare de la Hugging Face, nu e vendor-uit aici.
//
// Rulat automat de `npm run dev` și `npm run build` (pre-scripturi).
import { build } from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const radacina = join(dirname(fileURLToPath(import.meta.url)), "..");
const iesire = join(radacina, "public", "vendor", "embeddinguri");

await build({
  entryPoints: [join(radacina, "lib", "import", "embeddinguri.worker.ts")],
  outfile: join(iesire, "worker.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  minify: true,
  logLevel: "warning",
});

console.log("embeddinguri: worker.js scris în public/vendor/embeddinguri/");
