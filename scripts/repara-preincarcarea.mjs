/**
 * Next 16 scrie bucata de preîncărcare a unei rute în
 * `out/curs/__next.curs/__PAGE__.txt`, dar browserul o cere de la
 * `out/curs/__next.curs.__PAGE__.txt` — cu punct, nu cu folder.
 *
 * Diferența n-a stricat nimic (Next reîncarcă pagina întreagă când nu găsește
 * bucata), dar umplea consola cu 404-uri. Aici se pune fișierul și în forma
 * cerută. De scos când Next repară numele.
 */
import { copyFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const radacina = path.join(import.meta.dirname, "..", "out");
let puse = 0;

async function treci(dosar) {
  let intrari;
  try {
    intrari = await readdir(dosar, { withFileTypes: true });
  } catch {
    return;
  }

  for (const intrare of intrari) {
    const cale = path.join(dosar, intrare.name);
    if (!intrare.isDirectory()) continue;

    if (intrare.name.startsWith("__next.")) {
      for (const fisier of await readdir(cale)) {
        const tinta = path.join(dosar, `${intrare.name}.${fisier}`);
        await copyFile(path.join(cale, fisier), tinta);
        puse++;
      }
      continue;
    }

    await treci(cale);
  }
}

if ((await stat(radacina).catch(() => null))?.isDirectory()) {
  await treci(radacina);
  console.log(`${puse} bucăți de preîncărcare puse și în forma cerută`);
}
