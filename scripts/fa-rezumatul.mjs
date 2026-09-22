// Scoate din cursul livrat cele patru numere de pe copertă și le scrie într-un
// fișier TypeScript, `lib/continut/rezumat.ts`.
//
// Coperta trebuie să apară instantaneu (`PLAN.md` Î-16), deci nu poate
// aștepta un `fetch`. Dar nici nu vrem cursul întreg în bundle, și nici două
// adevăruri care se despart în tăcere. Așa că: un fișier generat, mic, comis
// în repo, refăcut la fiecare build din JSON-ul care e adevărul.

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aici = dirname(fileURLToPath(import.meta.url));
const radacina = join(aici, "..");

const curs = JSON.parse(
  await readFile(join(radacina, "public", "cursuri", "python.json"), "utf8"),
);

const capitol = curs.capitole[0];
const lectii = capitol.niveluri.length;
const exercitii = capitol.niveluri.reduce(
  (s, n) => s + n.exercitii.length,
  0,
);

const text = `// Generat de \`scripts/fa-rezumatul.mjs\` din \`public/cursuri/python.json\`.
// Nu se scrie de mână: se schimbă cursul, se reface la build.

export const REZUMAT = {
  materie: ${JSON.stringify(curs.materie)},
  capitol: ${JSON.stringify(capitol.nume)},
  lectii: ${lectii},
  exercitii: ${exercitii},
} as const;
`;

await writeFile(join(radacina, "lib", "continut", "rezumat.ts"), text, "utf8");
console.log(
  `rezumat: ${curs.materie} · ${capitol.nume} · ${lectii} lecții, ${exercitii} exerciții`,
);
