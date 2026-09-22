// Scoate din cursurile livrate numerele de pe copertă și le scrie într-un
// fișier TypeScript, `lib/continut/rezumat.ts`.
//
// Coperta trebuie să apară instantaneu (`PLAN.md` Î-16), deci nu poate
// aștepta un `fetch`. Dar nici nu vrem cursurile întregi în bundle, și nici
// două adevăruri care se despart în tăcere. Așa că: un fișier generat, mic,
// comis în repo, refăcut la fiecare build din JSON-urile care sunt adevărul.

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const aici = dirname(fileURLToPath(import.meta.url));
const radacina = join(aici, "..");

// Lista cursurilor e cea din aplicație, nu un al doilea catalog: un curs
// adăugat în `livrate.ts` și uitat aici ar lipsi de pe copertă.
const { CURSURI_LIVRATE } = await import(
  pathToFileURL(join(radacina, "lib", "continut", "cursuri.ts")).href
);

const rezumate = [];
for (const cheie of CURSURI_LIVRATE) {
  const curs = JSON.parse(
    await readFile(join(radacina, "public", "cursuri", `${cheie}.json`), "utf8"),
  );
  const lectii = curs.capitole.reduce((s, c) => s + c.niveluri.length, 0);
  const exercitii = curs.capitole.reduce(
    (s, c) => s + c.niveluri.reduce((t, n) => t + n.exercitii.length, 0),
    0,
  );
  rezumate.push({
    cheie,
    materie: curs.materie,
    limbaj: curs.limbaj ?? "python",
    capitol: curs.capitole[0].nume,
    lectii,
    exercitii,
  });
}

const randuri = rezumate
  .map(
    (r) => `  {
    cheie: ${JSON.stringify(r.cheie)},
    materie: ${JSON.stringify(r.materie)},
    limbaj: ${JSON.stringify(r.limbaj)},
    capitol: ${JSON.stringify(r.capitol)},
    lectii: ${r.lectii},
    exercitii: ${r.exercitii},
  },`,
  )
  .join("\n");

const text = `// Generat de \`scripts/fa-rezumatul.mjs\` din \`public/cursuri/*.json\`.
// Nu se scrie de mână: se schimbă un curs, se reface la build.

export const REZUMATE = [
${randuri}
] as const;

/** Cursul cu care se deschide coperta. */
export const REZUMAT = REZUMATE[0];
`;

await writeFile(join(radacina, "lib", "continut", "rezumat.ts"), text, "utf8");
console.log(
  `rezumat: ${rezumate
    .map((r) => `${r.materie} · ${r.lectii} lecții, ${r.exercitii} exerciții`)
    .join(" | ")}`,
);
