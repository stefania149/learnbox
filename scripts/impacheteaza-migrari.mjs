// Migrările sunt fișiere .sql comise în repo. Browserul n-are cum să citească
// de pe disc, așa că le împachetăm într-un modul importat de aplicație.
// Se rulează după `drizzle-kit generate`, prin `npm run date:genereaza`.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dosar = "migrari";
const iesire = "lib/date/migrari-generate.ts";

const fisiere = readdirSync(dosar)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const bucati = fisiere.map((f) => {
  const sql = readFileSync(join(dosar, f), "utf8");
  return `  {\n    nume: ${JSON.stringify(f)},\n    sql: ${JSON.stringify(sql)},\n  },`;
});

writeFileSync(
  iesire,
  `// GENERAT de scripts/impacheteaza-migrari.mjs — nu se editează de mână.
// Sursa sunt fișierele din migrari/, care rămân adevărul.

export type Migrare = { nume: string; sql: string };

export const migrari: Migrare[] = [
${bucati.join("\n")}
];
`,
  "utf8",
);

console.log(`${fisiere.length} migrări împachetate în ${iesire}`);
