// Umple șablonul `public/sw.js` cu ce a ieșit efectiv din build.
//
// Rulează după `next build`, peste `out/sw.js`. Ce se pune înăuntru:
//
//   versiunea  — amprenta coajei. Se schimbă la orice modificare de cod, deci
//                depozitul vechi se aruncă și nu rămâi cu pagini amestecate.
//   motoarele  — amprenta lui `vendor/`. Se schimbă doar la urcarea lui
//                Pyodide sau PGlite, ca cei 31 MB să nu se redescarce degeaba.
//   precache   — adresele coajei, tot ce e în `out/` mai puțin motoarele.

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const aici = dirname(fileURLToPath(import.meta.url));
const iesire = join(aici, "..", "out");
const baza = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Nu intră în coajă: motoarele, hărțile de depanare, și fișierele WASM pe care
 * Turbopack le pune sub `_next/static/media/` — acolo stă încă o copie a lui
 * PGlite, 16 MB. Coaja trebuie să rămână ceva ce se descarcă într-o clipă.
 */
function eInAfaraCoajei(cale) {
  return (
    cale.startsWith("vendor/") ||
    cale.endsWith(".map") ||
    cale.endsWith(".wasm") ||
    cale.endsWith(".data")
  );
}

async function fisiere(radacina, prefix = "") {
  const intrari = await readdir(join(radacina, prefix), { withFileTypes: true });
  const gasite = [];
  for (const intrare of intrari) {
    const cale = prefix ? `${prefix}/${intrare.name}` : intrare.name;
    if (intrare.isDirectory()) gasite.push(...(await fisiere(radacina, cale)));
    else gasite.push(cale);
  }
  return gasite;
}

/** `curs/index.html` se cere ca `/curs/`, nu ca fișier. */
function adresa(cale) {
  const fara = cale.endsWith("/index.html")
    ? cale.slice(0, -"index.html".length)
    : cale === "index.html"
      ? ""
      : cale;
  return `${baza}/${fara}`;
}

const toate = (await fisiere(iesire)).map((c) => c.split(sep).join("/"));

const coaja = toate.filter((c) => !eInAfaraCoajei(c) && c !== "sw.js");
const motoare = toate.filter((c) => c.startsWith("vendor/")).sort();

// Amprenta coajei: numele și conținutul, într-o ordine stabilă. Două build-uri
// din același cod dau aceeași amprentă, deci un redeploy fără schimbări nu
// aruncă depozitul utilizatorului.
const amprentaCoajei = createHash("sha256");
for (const cale of [...coaja].sort()) {
  amprentaCoajei.update(cale);
  amprentaCoajei.update(await readFile(join(iesire, cale)));
}

// Amprenta motoarelor: doar numele și mărimile. Ar dura prea mult să citim
// 31 MB la fiecare build, iar o versiune nouă de Pyodide schimbă oricum ori
// numele, ori mărimea fișierelor.
const amprentaMotoarelor = createHash("sha256");
for (const cale of motoare) {
  const continut = await readFile(join(iesire, cale));
  amprentaMotoarelor.update(`${cale}:${continut.length}`);
}

const scurt = (h) => h.digest("hex").slice(0, 12);
const versiune = scurt(amprentaCoajei);
const semnMotoare = scurt(amprentaMotoarelor);
const adrese = [...new Set(coaja.map(adresa))].sort();

const sablon = await readFile(join(iesire, "sw.js"), "utf8");
const scris = sablon
  .replace("__VERSIUNE__", versiune)
  .replace("__MOTOARE__", semnMotoare)
  .replace("__BAZA__", baza)
  .replace('["__PRECACHE__"]', JSON.stringify(adrese, null, 2));

// Un marcaj rămas pe loc înseamnă un service worker care nu face nimic — mai
// bine cade build-ul decât să se publice așa. Se caută anume marcajele
// noastre: numele fișierelor de preîncărcare conțin și ele `__`.
const ramas = scris.match(/__(?:VERSIUNE|MOTOARE|BAZA|PRECACHE)__/)?.[0];
if (ramas) throw new Error(`sw: marcajul ${ramas} n-a fost înlocuit`);

await writeFile(join(iesire, "sw.js"), scris);

const octeti = (await Promise.all(
  coaja.map(async (c) => (await readFile(join(iesire, c))).length),
)).reduce((s, n) => s + n, 0);

console.log(
  `sw: coaja ${versiune}, ${adrese.length} adrese, ${(octeti / 1024 / 1024).toFixed(1)} MB;` +
    ` motoarele ${semnMotoare}, ${motoare.length} fișiere, aduse la cerere`,
);
