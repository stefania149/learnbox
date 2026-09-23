/**
 * Generarea cursului propriu — pasul 20 (`PLAN.md` §6, punctul 4).
 *
 * Graful de concepte (pasul 19) se așază topologic — un concept apare abia
 * după toate cele de care depinde. Fiecare concept devine o lecție: un
 * briefing scurt (reia descrierea deja scrisă la pasul 19 — un apel de model
 * mai puțin) și un exercițiu.
 *
 * **Verdictul nu trece prin model, nici la conținut generat** (principiul 1):
 * cazurile de test nu sunt ce spune modelul că ar ieși, ci ce iese chiar din
 * rularea soluției lui în Pyodide. Dacă soluția nu rulează, sau codul de
 * pornire trece deja totul, lecția aia se sare — nu ajunge în bază o lecție
 * stricată.
 *
 * **Incrementală și reluabilă**: o lecție intră în bază abia gata (briefing +
 * exercițiu verificat) — nimic pe jumătate. `genereazaCursul` reia de unde a
 * rămas: sare lecțiile care există deja, indiferent dacă fila s-a închis la
 * mijloc.
 */
import { eq } from "drizzle-orm";
import { deschideBaza } from "@/lib/date/client";
import { capitol, concept, conceptLeg, exercitiu, nivel } from "@/lib/date/schema";
import { materiaProprie } from "@/lib/date/seminte";
import { descarcaModelul, motorPornit } from "@/lib/rutare-model";
import { python, RABDARE_MS } from "@/lib/python/client";
import { PRELUDIU, SAMANTA } from "@/lib/exercitii/determinism";
import type { CazTest } from "@/lib/exercitii/motor";
import type { MLCEngineInterface } from "@mlc-ai/web-llm";

const CHEIE_CAPITOL = "materialul-tau";
const cheieNivel = (conceptId: number) => `concept-${conceptId}`;
const cheieExercitiu = (conceptId: number) => `exercitiu-${conceptId}`;

type ConceptRand = { id: number; nume: string; descriere: string | null };

/** Kahn, cu ruperea ciclurilor pe cel mai mic `id` — un model mic poate scrie „A depinde de A". */
async function ordineaTopologica(materieId: number): Promise<ConceptRand[]> {
  const { baza } = await deschideBaza();
  const concepte = await baza
    .select({ id: concept.id, nume: concept.nume, descriere: concept.descriere })
    .from(concept)
    .where(eq(concept.materieId, materieId));
  const legaturi = await baza
    .select({ conceptId: conceptLeg.conceptId, dependeDeId: conceptLeg.dependeDeId })
    .from(conceptLeg);

  const dependeDePe = new Map<number, number[]>();
  for (const c of concepte) dependeDePe.set(c.id, []);
  for (const l of legaturi) dependeDePe.get(l.conceptId)?.push(l.dependeDeId);

  const ordonate: ConceptRand[] = [];
  const facute = new Set<number>();
  const ramase = new Map(concepte.map((c) => [c.id, c]));

  while (ramase.size > 0) {
    let gasit: ConceptRand | undefined;
    for (const c of ramase.values()) {
      const deps = dependeDePe.get(c.id) ?? [];
      if (deps.every((d) => facute.has(d) || !ramase.has(d))) {
        gasit = c;
        break;
      }
    }
    gasit ??= [...ramase.values()].sort((a, b) => a.id - b.id)[0];
    ordonate.push(gasit);
    facute.add(gasit.id);
    ramase.delete(gasit.id);
  }
  return ordonate;
}

export type ConceptDeGenerat = { id: number; nume: string; gata: boolean };

/** Planul, în ordinea în care se generează. Nu cere model — se arată imediat. */
export async function planulGenerarii(): Promise<ConceptDeGenerat[]> {
  const { baza } = await deschideBaza();
  const materieId = await materiaProprie();
  const concepte = await ordineaTopologica(materieId);

  const capRand = (
    await baza.select().from(capitol).where(eq(capitol.materieId, materieId))
  )[0];
  const niveluri = capRand
    ? await baza.select({ cheie: nivel.cheie }).from(nivel).where(eq(nivel.capitolId, capRand.id))
    : [];
  const cheiGata = new Set(niveluri.map((n) => n.cheie));

  return concepte.map((c) => ({
    id: c.id,
    nume: c.nume,
    gata: cheiGata.has(cheieNivel(c.id)),
  }));
}

type ExercitiuGenerat = {
  enunt: string;
  cod: string;
  apeluri: string[];
};

const SCHEMA_EXERCITIU = {
  type: "object",
  properties: {
    enunt: { type: "string" },
    cod: { type: "string" },
    apeluri: { type: "array", items: { type: "string" } },
  },
  required: ["enunt", "cod", "apeluri"],
};

async function genereazaExercitiul(
  motor: MLCEngineInterface,
  c: ConceptRand,
): Promise<ExercitiuGenerat | null> {
  const raspuns = await motor.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Scrii un exercițiu scurt de Python, pentru un începător, despre un concept anume. „cod” e o singură funcție Python completă și corectă, care începe cu „def NUME(...):”. „apeluri” sunt 3 chemări valide ale EXACT ACELEIAȘI funcții, cu NUMELE EI, nu alt nume — de exemplu, dacă funcția e „def dubla(n):”, apelurile arată ca \"dubla(3)\", \"dubla(7)\", nu ca alt nume de funcție. Enunțul, în română, spune ce trebuie să facă funcția, fără s-o arate. Răspunde numai cu JSON, conform schemei.",
      },
      {
        role: "user",
        content: `Concept: ${c.nume}${c.descriere ? `\nCe înseamnă: ${c.descriere}` : ""}`,
      },
    ],
    response_format: { type: "json_object", schema: JSON.stringify(SCHEMA_EXERCITIU) },
    max_tokens: 600,
    temperature: 0.3,
  });

  try {
    const o = JSON.parse(raspuns.choices[0]?.message?.content ?? "{}") as Record<
      string,
      unknown
    >;
    if (
      typeof o.enunt !== "string" ||
      o.enunt.trim() === "" ||
      typeof o.cod !== "string" ||
      !o.cod.trim().startsWith("def ") ||
      !Array.isArray(o.apeluri)
    ) {
      return null;
    }
    const apeluri = o.apeluri.filter((a): a is string => typeof a === "string" && a.trim() !== "");
    if (apeluri.length === 0) return null;
    return { enunt: o.enunt.trim(), cod: o.cod.trim(), apeluri: apeluri.slice(0, 5) };
  } catch {
    return null;
  }
}

/** Antetul funcției (prima linie a `cod`-ului), pentru codul de pornire. */
function antetul(cod: string): string | null {
  const primaLinie = cod.split("\n")[0]?.trim();
  return primaLinie && primaLinie.startsWith("def ") && primaLinie.endsWith(":")
    ? primaLinie
    : null;
}

/** Numele funcției, din antetul ei (`def dubla(n):` → `dubla`). */
function numeleFunctiei(antet: string): string | null {
  const potrivire = /^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/.exec(antet);
  return potrivire?.[1] ?? null;
}

/**
 * Rulează `cod` și `apeluri` prin Pyodide și întoarce ce a ieșit cu adevărat
 * — `repr`-ul fiecărei valori, sau `null` dacă apelul a picat. Verdictul nu
 * trece prin model: astea sunt cazurile de test, luate din execuție reală, nu
 * din ce a scris modelul că ar ieși.
 */
async function descoperaRezultatele(
  cod: string,
  apeluri: string[],
): Promise<(string | null)[] | null> {
  const dateApeluri = JSON.stringify(JSON.stringify(apeluri));
  const script = `
import json as _tut_json
_tut_apeluri = _tut_json.loads(${dateApeluri})
_tut_rezultate = []
for _tut_apel in _tut_apeluri:
    _tut_random.seed(${SAMANTA})
    try:
        _tut_rezultate.append(repr(eval(_tut_apel, globals())))
    except Exception:
        _tut_rezultate.append(None)
_tut_json.dumps(_tut_rezultate)
`;
  const rezultat = await python().ruleaza(`${PRELUDIU}\n${cod}\n${script}`, {
    rabdareMs: RABDARE_MS,
  });
  if (rezultat.fel !== "gata" || rezultat.valoare === null) return null;
  try {
    return JSON.parse(rezultat.valoare) as (string | null)[];
  } catch {
    return null;
  }
}

/**
 * O lecție, din concept până în bază. Întoarce `false` fără să scrie nimic
 * dacă modelul n-a produs ceva utilizabil — nu ajunge o lecție stricată în
 * joc.
 */
async function genereazaNivelul(
  motor: MLCEngineInterface,
  capitolId: number,
  ordine: number,
  c: ConceptRand,
): Promise<boolean> {
  const ex = await genereazaExercitiul(motor, c);
  if (!ex) return false;

  const antet = antetul(ex.cod);
  if (!antet) return false;
  const nume = numeleFunctiei(antet);
  if (!nume) return false;

  // Modelul mic ancorează des pe alt nume de funcție decât cel scris în cod
  // (de exemplu, pe unul dat ca exemplu în prompt) — apelurile alea nu duc
  // nicăieri, deci se scot înainte să pornim Pyodide degeaba.
  const apeluriPotrivite = ex.apeluri.filter((a) => a.trimStart().startsWith(`${nume}(`));
  if (apeluriPotrivite.length === 0) return false;

  const rezultate = await descoperaRezultatele(ex.cod, apeluriPotrivite);
  if (!rezultate) return false;

  const cazuri: CazTest[] = apeluriPotrivite
    .map((apel, i) => ({ apel, asteptat: rezultate[i] }))
    .filter((cz): cz is CazTest => cz.asteptat !== null);
  // Sub două cazuri utile nu merită un exercițiu — prea puțin de arătat.
  if (cazuri.length < 2) return false;

  const codInitial = `${antet}\n    pass`;
  const dinInitial = await descoperaRezultatele(codInitial, apeluriPotrivite);
  const initialTreceTot =
    dinInitial !== null &&
    cazuri.every((cz) => {
      const indice = apeluriPotrivite.indexOf(cz.apel);
      return indice !== -1 && dinInitial[indice] === cz.asteptat;
    });
  // Dacă „pass" nimerește deja totul (funcția n-avea ce returna, de exemplu),
  // exercițiul ăsta ar fi deja rezolvat din prima — se sare.
  if (initialTreceTot) return false;

  const { baza } = await deschideBaza();
  const [randNivel] = await baza
    .insert(nivel)
    .values({
      capitolId,
      cheie: cheieNivel(c.id),
      nume: c.nume,
      ordine,
      briefing: { ecrane: [{ titlu: c.nume, text: c.descriere ?? c.nume }] },
    })
    .returning();

  await baza.insert(exercitiu).values({
    nivelId: randNivel.id,
    cheie: cheieExercitiu(c.id),
    ordine: 1,
    tip: "scrie",
    limbaj: "python",
    enunt: ex.enunt,
    codInitial,
    solutie: ex.cod,
    cazuriTest: cazuri,
    explicatiePredefinita: c.descriere ?? ex.enunt,
  });

  return true;
}

export type RaportCurs = { facute: number; total: number; nume: string };

/**
 * Construiește (sau continuă) cursul propriu. Nu pornește modelul singur
 * dacă nu era deja pornit în sesiunea asta — apelantul se asigură dinainte
 * (regula 5).
 */
export async function genereazaCursul(
  onProgres?: (r: RaportCurs) => void,
): Promise<{ generate: number; sarite: number }> {
  const motor = await (motorPornit() ?? descarcaModelul());

  const { baza } = await deschideBaza();
  const materieId = await materiaProprie();

  let capRand = (
    await baza.select().from(capitol).where(eq(capitol.materieId, materieId))
  )[0];
  if (!capRand) {
    [capRand] = await baza
      .insert(capitol)
      .values({ materieId, cheie: CHEIE_CAPITOL, nume: "Materialul tău", ordine: 1 })
      .returning();
  }

  const concepte = await ordineaTopologica(materieId);
  const niveluriExistente = await baza
    .select({ cheie: nivel.cheie })
    .from(nivel)
    .where(eq(nivel.capitolId, capRand.id));
  const cheiGata = new Set(niveluriExistente.map((n) => n.cheie));

  let generate = 0;
  let sarite = 0;

  for (let i = 0; i < concepte.length; i++) {
    const c = concepte[i];
    if (!cheiGata.has(cheieNivel(c.id))) {
      const reusit = await genereazaNivelul(motor, capRand.id, i + 1, c);
      if (reusit) generate++;
      else sarite++;
    }
    onProgres?.({ facute: i + 1, total: concepte.length, nume: c.nume });
  }

  return { generate, sarite };
}
