// Iconițele PWA, făcute din SVG la fiecare build.
//
// Android nu instalează fără cel puțin o iconiță PNG de 192, iar ecranul de
// pornire cere una de 512. `sharp` vine oricum cu Next, deci nu adăugăm nimic
// la dependențe; sursele sunt în `scripts/iconite/`, ca să existe un singur
// loc unde se desenează semnul.

import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aici = dirname(fileURLToPath(import.meta.url));
const radacina = join(aici, "..");
const spre = join(radacina, "public", "iconite");

/** Sursă, dimensiune, nume de ieșire. */
const DE_FACUT = [
  { sursa: "iconita.svg", latura: 192, nume: "iconita-192.png" },
  { sursa: "iconita.svg", latura: 512, nume: "iconita-512.png" },
  { sursa: "iconita-masca.svg", latura: 512, nume: "iconita-masca-512.png" },
];

await mkdir(spre, { recursive: true });

for (const { sursa, latura, nume } of DE_FACUT) {
  const svg = await readFile(join(aici, "iconite", sursa));
  const png = await sharp(svg, { density: 384 })
    .resize(latura, latura)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(join(spre, nume), png);
  console.log(`iconite: ${nume} (${latura}×${latura}, ${png.length} octeți)`);
}
