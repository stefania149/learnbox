// Servește `out/` pe localhost, ca să se poată proba exportul adevărat.
//
// Nu contrazice principiul 6: la rulare, aplicația publicată stă pe GitHub
// Pages, care e tot fișiere statice. Asta e doar unealta de probă de pe
// calculatorul autorului — service worker-ul și instalarea nu se pot încerca
// pe serverul de dezvoltare, fiindcă acolo nu se înregistrează.
//
//   node scripts/serveste-exportul.mjs [port]

import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const aici = dirname(fileURLToPath(import.meta.url));
const radacina = join(aici, "..", "out");
const port = Number(process.argv[2] ?? 4188);

const TIPURI = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
  ".data": "application/octet-stream",
};

async function fisierul(cale) {
  // Fără ieșire din `out/`: calea se normalizează și se verifică prefixul.
  const cerut = normalize(join(radacina, decodeURIComponent(cale)));
  if (!cerut.startsWith(radacina)) return null;
  try {
    const info = await stat(cerut);
    if (info.isDirectory()) return fisierul(join(cale, "index.html"));
    return { cale: cerut, marime: info.size };
  } catch {
    return null;
  }
}

createServer(async (cerere, raspuns) => {
  const adresa = new URL(cerere.url ?? "/", `http://localhost:${port}`);
  const gasit =
    (await fisierul(adresa.pathname)) ??
    (await fisierul(`${adresa.pathname}.html`));

  if (!gasit) {
    const patruSuteIsPatru = await fisierul("/404.html");
    if (patruSuteIsPatru) {
      raspuns.writeHead(404, { "content-type": TIPURI[".html"] });
      createReadStream(patruSuteIsPatru.cale).pipe(raspuns);
      return;
    }
    raspuns.writeHead(404, { "content-type": TIPURI[".txt"] });
    raspuns.end("nu există");
    return;
  }

  raspuns.writeHead(200, {
    "content-type": TIPURI[extname(gasit.cale)] ?? "application/octet-stream",
    "content-length": gasit.marime,
    // Fără memorare în browser: depozitul service worker-ului e singurul pe
    // care vrem să-l vedem lucrând.
    "cache-control": "no-store",
  });
  createReadStream(gasit.cale).pipe(raspuns);
}).listen(port, () => {
  console.log(`exportul: http://localhost:${port}/`);
});
