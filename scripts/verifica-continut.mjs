/**
 * Verifică, cu Python adevărat, că fiecare exercițiu livrat e coerent:
 *
 * - soluția trece toate cazurile ei;
 * - codul de pornire **nu** le trece pe toate (altfel exercițiul e deja făcut);
 * - fiecare exercițiu are explicație predefinită și cel puțin trei cazuri.
 *
 * Rulează aceleași bucăți ca aplicația: preludiul de determinism și hamul de
 * cazuri din `lib/exercitii`. Se cheamă cu `npm run continut:verifica`.
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPyodide } from "pyodide";
import { PRELUDIU, SAMANTA } from "../lib/exercitii/determinism.ts";
import { citesteCurs } from "../lib/continut/format.ts";

// Se citește din fișierul de curs livrat, prin aceeași verificare de format pe
// care o face aplicația la încărcare (pasul 11): dacă fișierul e stricat, se
// află aici, nu în browserul cuiva.
//
// Cursul se dă ca argument (`npm run continut:verifica sql`); fără argument se
// ia cel implicit. De la pasul 12 fișierele nu mai sunt scrise de mână, deci
// verificarea trebuie să meargă peste oricare dintre ele.
const radacina = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHEIE = process.argv[2] ?? "python";
const CURS = citesteCurs(
  JSON.parse(
    await readFile(join(radacina, "public", "cursuri", `${CHEIE}.json`), "utf8"),
  ),
);

/** Cât lăsăm un caz să meargă, în pași de interpretor. */
const PASI_MAXIM = 500_000;

const pyodide = await loadPyodide();

let cazuriRulate = 0;
const plangeri = [];

/** Aceeași comparare ca în motor: `repr` al valorii, text cu text. */
function ham(cazuri) {
  const date = JSON.stringify(JSON.stringify(cazuri));
  return `
import json as _tut_json
import sys as _tut_sys
import traceback as _tut_tb

_tut_cazuri = _tut_json.loads(${date})
_tut_rezultate = []
_tut_pasi = 0


# În aplicație, bucla fără sfârșit e oprită de cronometrul firului. Aici n-avem
# fir separat, așa că numărăm pașii și ne oprim singuri — altfel un cod de
# pornire stricat dinadins ar bloca verificarea la nesfârșit.
def _tut_paznic(cadru, eveniment, arg):
    global _tut_pasi
    _tut_pasi += 1
    if _tut_pasi > ${PASI_MAXIM}:
        raise RuntimeError("nu se oprește")
    return _tut_paznic


def _tut_ruleaza():
    global _tut_pasi
    for _tut_caz in _tut_cazuri:
        _tut_random.seed(${SAMANTA})
        _tut_pasi = 0
        _tut_sys.settrace(_tut_paznic)
        try:
            _tut_primit = repr(eval(_tut_caz["apel"], globals()))
        except Exception:
            _tut_primit = _tut_tb.format_exc().strip().splitlines()[-1]
        finally:
            _tut_sys.settrace(None)
        _tut_rezultate.append(_tut_primit)


_tut_ruleaza()
_tut_json.dumps(_tut_rezultate)
`;
}

async function treceCazurile(cod, cazuri) {
  const iesite = JSON.parse(
    await pyodide.runPythonAsync(`${PRELUDIU}\n${cod}\n${ham(cazuri)}`),
  );
  cazuriRulate += cazuri.length;
  return cazuri.map((caz, i) => ({
    apel: caz.apel,
    asteptat: caz.asteptat,
    primit: iesite[i],
    trece: iesite[i] === caz.asteptat,
  }));
}

const NIVELURI = CURS.capitole.flatMap((c) =>
  c.niveluri.map((n) => ({ ...n, capitol: c.nume })),
);

for (const nivel of NIVELURI) {
  for (const ex of nivel.exercitii) {
    const unde = `${nivel.capitol} → ${nivel.nume} → ${ex.enunt.slice(0, 50)}…`;

    if (ex.cazuriTest.length < 3) {
      plangeri.push(`${unde}: are doar ${ex.cazuriTest.length} cazuri.`);
    }
    if (!ex.explicatiePredefinita) {
      plangeri.push(`${unde}: n-are explicație predefinită.`);
    }

    const cuSolutia = await treceCazurile(ex.solutie, ex.cazuriTest);
    for (const r of cuSolutia) {
      if (!r.trece) {
        plangeri.push(
          `${unde}\n    soluția pică pe ${r.apel}: aștepta ${r.asteptat}, a dat ${r.primit}`,
        );
      }
    }

    const cuCodulDat = await treceCazurile(ex.codInitial, ex.cazuriTest);
    if (cuCodulDat.every((r) => r.trece)) {
      plangeri.push(`${unde}\n    codul de pornire trece deja toate cazurile.`);
    }
  }
}

const exercitii = NIVELURI.reduce((s, n) => s + n.exercitii.length, 0);
const ecrane = NIVELURI.reduce((s, n) => s + n.briefing.length, 0);
const capitole = CURS.capitole.map((c) => `„${c.nume}"`).join(", ");

console.log(
  `${CURS.materie} — ${capitole}: ${NIVELURI.length} lecții, ` +
    `${ecrane} ecrane de briefing, ${exercitii} exerciții, ` +
    `${cazuriRulate} rulări de cazuri.`,
);

if (plangeri.length > 0) {
  console.error(`\n${plangeri.length} probleme:\n`);
  for (const p of plangeri) console.error(`  - ${p}`);
  process.exit(1);
}

console.log("Totul se ține.");
