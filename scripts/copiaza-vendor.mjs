// PGlite și Pyodide se servesc ca fișiere statice, nu prin împachetător.
//
// Motivul, pentru PGlite: Turbopack rupe pachetul — fie pierde legătura către
// modulul care expune `instantiateWasm`, fie (cu `transpilePackages`) bagă cod
// care cere `window` în interiorul unui worker. Pyodide merge pe același drum
// din aceleași motive și pentru că își caută singur fișierele lângă el.
//
// Rulat automat de `npm run dev` și `npm run build` (pre-scripturi).
import { cpSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join } from "node:path";

/** Ce nu ajunge niciodată la utilizator: hărți de sursă, CommonJS, tipuri. */
const balast = [/\.map$/, /\.cjs$/, /\.d\.ts$/, /\.d\.cts$/];

const pachete = [
  {
    nume: "PGlite",
    sursa: "node_modules/@electric-sql/pglite/dist",
    destinatie: "public/vendor/pglite",
    // Arhivele de extensii se copiază când vom folosi vreuna.
    sari: [...balast, /\.tar\.gz$/],
  },
  {
    nume: "Pyodide",
    sursa: "node_modules/pyodide",
    destinatie: "public/vendor/pyodide",
    // Din pachet folosim doar nucleul: modulul ESM, WASM-ul și stdlib.
    sari: [
      ...balast,
      /\.html$/,
      /\.md$/,
      /pyodide\.js$/,
      /package\.json$/,
      /ffi/,
    ],
  },
];

function marime(cale) {
  let total = 0;
  for (const intrare of readdirSync(cale, { withFileTypes: true })) {
    const copil = join(cale, intrare.name);
    total += intrare.isDirectory() ? marime(copil) : statSync(copil).size;
  }
  return total;
}

for (const pachet of pachete) {
  if (!existsSync(pachet.sursa)) {
    console.error(`Lipsește ${pachet.sursa}. Rulează întâi npm install.`);
    process.exit(1);
  }

  rmSync(pachet.destinatie, { recursive: true, force: true });
  mkdirSync(pachet.destinatie, { recursive: true });

  cpSync(pachet.sursa, pachet.destinatie, {
    recursive: true,
    filter: (cale) => !pachet.sari.some((tipar) => tipar.test(cale)),
  });

  const mb = (marime(pachet.destinatie) / 1024 / 1024).toFixed(1);
  console.log(`${pachet.nume} copiat în ${pachet.destinatie} (${mb} MB)`);
}
