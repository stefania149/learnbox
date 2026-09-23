/**
 * Graful de concepte — pasul 19 (`PLAN.md` §6, punctele 2-3).
 *
 * Fiecare bucată de material trece prin model, care scoate conceptele ei
 * atomice și de ce alte concepte depinde fiecare — „nu poți face JOIN înainte
 * de SELECT". Un concept cerut ca dependență dar neacoperit de nicio bucată e
 * o lacună: modelul o scrie singur, marcată `provenienta = 'model'`.
 *
 * Verdictul jocului (regula 1) nu trece niciodată prin model — graful ăsta nu
 * e verdictul la nimic, e conținut generat, ca un curs livrat, doar că-l
 * scrie modelul din browser, nu autorul.
 */
import { eq, inArray, isNotNull } from "drizzle-orm";
import { deschideBaza } from "@/lib/date/client";
import { chunk, concept, conceptLeg, materie } from "@/lib/date/schema";
import { descarcaModelul, motorPornit } from "@/lib/rutare-model";
import type { MLCEngineInterface } from "@mlc-ai/web-llm";

export type RaportGraf = { faza: "concepte" | "lacune"; facute: number; total: number };

export type ConceptCitit = {
  id: number;
  nume: string;
  descriere: string | null;
  provenienta: string;
  dependeDe: string[];
};

function normalizeaza(nume: string): string {
  return nume.trim().toLowerCase();
}

const SCHEMA_CONCEPTE = {
  type: "object",
  properties: {
    concepte: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nume: { type: "string" },
          descriere: { type: "string" },
          depinde_de: { type: "array", items: { type: "string" } },
        },
        required: ["nume", "descriere", "depinde_de"],
      },
    },
  },
  required: ["concepte"],
};

type ConceptExtras = { nume: string; descriere: string; dependeDe: string[] };

async function extrageDinBucata(
  motor: MLCEngineInterface,
  text: string,
): Promise<ConceptExtras[]> {
  const raspuns = await motor.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Ești un profesor care scoate concepte atomice dintr-un text, pentru un graf de cunoștințe. Un concept e ceva ce se poate învăța separat. „depinde_de” conține numele altor concepte pe care trebuie să le știi înainte — listă goală dacă niciunul. Răspunde numai cu JSON, în română, conform schemei date.",
      },
      { role: "user", content: `Text:\n${text}` },
    ],
    response_format: {
      type: "json_object",
      schema: JSON.stringify(SCHEMA_CONCEPTE),
    },
    max_tokens: 800,
    temperature: 0.2,
  });

  const continut = raspuns.choices[0]?.message?.content ?? "";
  try {
    const desfacut = JSON.parse(continut) as { concepte?: unknown };
    if (!Array.isArray(desfacut.concepte)) return [];
    return desfacut.concepte.flatMap((c): ConceptExtras[] => {
      if (typeof c !== "object" || c === null) return [];
      const o = c as Record<string, unknown>;
      if (typeof o.nume !== "string" || o.nume.trim() === "") return [];
      return [
        {
          nume: o.nume.trim(),
          descriere: typeof o.descriere === "string" ? o.descriere.trim() : "",
          dependeDe: Array.isArray(o.depinde_de)
            ? o.depinde_de.filter((d): d is string => typeof d === "string")
            : [],
        },
      ];
    });
  } catch {
    return [];
  }
}

async function explicaLacuna(motor: MLCEngineInterface, nume: string): Promise<string> {
  const raspuns = await motor.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Explici, în 1-2 propoziții și în română, ce înseamnă un concept pentru cineva care tocmai învață materia. Fără introduceri, doar explicația.",
      },
      { role: "user", content: nume },
    ],
    max_tokens: 150,
    temperature: 0.2,
  });
  return raspuns.choices[0]?.message?.content?.trim() || nume;
}

/** Materia generată din materialul tău — una singură, reluată la fiecare import. */
async function materiaGenerata(): Promise<number> {
  const { baza } = await deschideBaza();
  const gasita = await baza
    .select()
    .from(materie)
    .where(eq(materie.sursa, "generat"));
  if (gasita[0]) return gasita[0].id;

  const [noua] = await baza
    .insert(materie)
    .values({ nume: "Materialul tău", sursa: "generat" })
    .returning();
  return noua.id;
}

async function materiaGenerataDacaExista(): Promise<number | null> {
  const { baza } = await deschideBaza();
  const gasita = await baza
    .select()
    .from(materie)
    .where(eq(materie.sursa, "generat"));
  return gasita[0]?.id ?? null;
}

/** Bucățile care încă n-au dat naștere niciunui concept. */
async function bucatiNeprocesate() {
  const { baza } = await deschideBaza();
  const toate = await baza.select().from(chunk);
  const procesate = await baza
    .select({ chunkId: concept.chunkId })
    .from(concept)
    .where(isNotNull(concept.chunkId));
  const idProcesate = new Set(procesate.map((p) => p.chunkId));
  return toate.filter((c) => !idProcesate.has(c.id));
}

/**
 * Construiește (sau continuă) graful din bucățile neprocesate încă. Nu
 * pornește modelul singur dacă nu era deja pornit în sesiunea asta —
 * apelantul se asigură de asta dinainte (regula 5).
 */
export async function construiesteGraful(
  onProgres?: (r: RaportGraf) => void,
): Promise<{ conceptelNoi: number; lacune: number }> {
  const motorPornirii = motorPornit() ?? descarcaModelul();
  const motor = await motorPornirii;

  const { baza } = await deschideBaza();
  const materieId = await materiaGenerata();
  const bucati = await bucatiNeprocesate();

  const existente = await baza
    .select()
    .from(concept)
    .where(eq(concept.materieId, materieId));
  const dupaNume = new Map(existente.map((c) => [normalizeaza(c.nume), c]));

  const dependente: { conceptId: number; nume: string }[] = [];
  let conceptelNoi = 0;

  for (let i = 0; i < bucati.length; i++) {
    const b = bucati[i];
    const extrase = await extrageDinBucata(motor, b.text);

    for (const e of extrase) {
      const cheie = normalizeaza(e.nume);
      if (dupaNume.has(cheie)) continue;

      const [rand] = await baza
        .insert(concept)
        .values({
          materieId,
          nume: e.nume,
          descriere: e.descriere || null,
          provenienta: "material",
          chunkId: b.id,
        })
        .returning();
      dupaNume.set(cheie, rand);
      conceptelNoi++;

      for (const dep of e.dependeDe) {
        if (normalizeaza(dep) !== cheie) dependente.push({ conceptId: rand.id, nume: dep });
      }
    }

    onProgres?.({ faza: "concepte", facute: i + 1, total: bucati.length });
  }

  let lacune = 0;
  for (let i = 0; i < dependente.length; i++) {
    const dep = dependente[i];
    const cheie = normalizeaza(dep.nume);
    let tinta = dupaNume.get(cheie);

    if (!tinta) {
      const descriere = await explicaLacuna(motor, dep.nume);
      const [rand] = await baza
        .insert(concept)
        .values({ materieId, nume: dep.nume, descriere, provenienta: "model" })
        .returning();
      dupaNume.set(cheie, rand);
      tinta = rand;
      lacune++;
    }

    if (tinta.id !== dep.conceptId) {
      await baza
        .insert(conceptLeg)
        .values({ conceptId: dep.conceptId, dependeDeId: tinta.id })
        .onConflictDoNothing();
    }

    onProgres?.({ faza: "lacune", facute: i + 1, total: dependente.length });
  }

  return { conceptelNoi, lacune };
}

export async function citesteGraful(): Promise<ConceptCitit[]> {
  const { baza } = await deschideBaza();
  const materieId = await materiaGenerataDacaExista();
  if (materieId === null) return [];

  const concepte = await baza
    .select()
    .from(concept)
    .where(eq(concept.materieId, materieId));
  if (concepte.length === 0) return [];

  const legaturi = await baza
    .select()
    .from(conceptLeg)
    .where(
      inArray(
        conceptLeg.conceptId,
        concepte.map((c) => c.id),
      ),
    );

  const numeDupaId = new Map(concepte.map((c) => [c.id, c.nume]));
  const dependePe = new Map<number, string[]>();
  for (const l of legaturi) {
    const lista = dependePe.get(l.conceptId) ?? [];
    lista.push(numeDupaId.get(l.dependeDeId) ?? "?");
    dependePe.set(l.conceptId, lista);
  }

  return concepte
    .map((c) => ({
      id: c.id,
      nume: c.nume,
      descriere: c.descriere,
      provenienta: c.provenienta,
      dependeDe: dependePe.get(c.id) ?? [],
    }))
    .sort((a, b) => a.nume.localeCompare(b.nume, "ro"));
}

/** Câte bucăți mai așteaptă să treacă prin model. */
export async function bucatiDeProcesat(): Promise<number> {
  return (await bucatiNeprocesate()).length;
}
