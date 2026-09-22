// WebLLM se servește ca fișiere statice, nu prin Turbopack — din același
// motiv ca PGlite (`copiaza-vendor.mjs`): un `new Worker(new URL("./x.ts",
// import.meta.url))` a ieșit din build ca sursa TypeScript neatinsă, copiată
// ca „asset" generic, nu ca fir adevărat. Firul ar cădea la prima linie.
//
// E și o problemă de mărime (`PLAN.md` §4): pachetul are ~6 MB de cod, prea
// mult pentru coajă. Bundle-uite aici ajung în `public/vendor/`, care
// `scripts/fa-service-worker.mjs` îl scoate din precache — se aduc doar când
// utilizatorul cere asistentul (`lib/rutare-model.ts`).
//
// Rulat automat de `npm run dev` și `npm run build` (pre-scripturi).
import { build } from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const radacina = join(dirname(fileURLToPath(import.meta.url)), "..");
const iesire = join(radacina, "public", "vendor", "web-llm");

const comun = {
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  minify: true,
  logLevel: "warning",
};

await build({
  ...comun,
  entryPoints: [join(radacina, "lib", "rutare-model.worker.ts")],
  outfile: join(iesire, "worker.js"),
});

// Partea de pe firul principal: doar `CreateWebWorkerMLCEngine` și
// `hasModelInCache`, dar biblioteca nu se împarte ușor — vine tot pachetul.
await build({
  ...comun,
  entryPoints: [
    join(radacina, "node_modules", "@mlc-ai", "web-llm", "lib", "index.js"),
  ],
  outfile: join(iesire, "index.js"),
});

console.log("web-llm: worker.js și index.js scrise în public/vendor/web-llm/");
