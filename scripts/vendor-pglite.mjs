// PGlite se servește ca fișiere statice, nu prin împachetător.
//
// Motivul: Turbopack rupe pachetul — fie pierde legătura către modulul care
// expune `instantiateWasm`, fie (cu `transpilePackages`) bagă cod care cere
// `window` în interiorul unui worker. Copiat pe lângă aplicație, PGlite se
// încarcă exact cum l-a publicat autorul lui.
//
// Rulat automat de `npm run dev` și `npm run build` (pre-scripturi).
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

const sursa = "node_modules/@electric-sql/pglite/dist";
const destinatie = "public/vendor/pglite";

// Hărțile de sursă, varianta CommonJS și declarațiile de tipuri n-au ce căuta
// la utilizator. Arhivele de extensii se copiază când vom folosi vreuna.
const deSarit = [/\.map$/, /\.cjs$/, /\.d\.ts$/, /\.d\.cts$/, /\.tar\.gz$/];

if (!existsSync(sursa)) {
  console.error(`Lipsește ${sursa}. Rulează întâi npm install.`);
  process.exit(1);
}

rmSync(destinatie, { recursive: true, force: true });
mkdirSync(destinatie, { recursive: true });

cpSync(sursa, destinatie, {
  recursive: true,
  filter: (cale) => !deSarit.some((tipar) => tipar.test(cale)),
});

console.log(`PGlite copiat în ${destinatie}`);
