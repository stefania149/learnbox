/**
 * Aducerea bazei locale la zi cu fișierul de curs livrat.
 *
 * De la pasul 11, potrivirea se face după `cheie`, nu după nume și enunț.
 * Asta schimbă totul: un enunț rescris rămâne același exercițiu, cu aceleași
 * încercări în spate. Așezarea se poate deci relua oricând — e o potrivire,
 * nu o turnare — și nu mai are nevoie de pachete aplicate o dată pe viață.
 *
 * Nimic nu se șterge, nici aici: o lecție scoasă din fișier rămâne în bază,
 * cu istoricul ei. `incercare` trimite la exerciții, iar `incercare` e
 * imutabilă (principiul 8).
 */
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { deschideBaza } from "./client";
import { capitol, exercitiu, materie, nivel, test } from "./schema";
import {
  cursLivrat,
  CURS_IMPLICIT,
  CURS_PROPRIU,
  type CheieCurs,
} from "@/lib/continut/livrate";
import type { CheieCursLivrat } from "@/lib/continut/cursuri";
import { scrieMaterieActiva } from "./setari";
import type {
  CapitolLivrat,
  EcranBriefing,
  IntrebareTest,
  TestLivrat,
} from "@/lib/continut/format";
import type { CazTest, Limbaj } from "@/lib/exercitii/motor";

export type { EcranBriefing, IntrebareTest };
export type Exercitiu = typeof exercitiu.$inferSelect;
export type Nivel = typeof nivel.$inferSelect;
export type Test = typeof test.$inferSelect;

/** Întrebările ajung în `jsonb`, deci se citesc înapoi ca `unknown`. */
export function intrebarile(t: Test): IntrebareTest[] {
  return (t.intrebari ?? []) as IntrebareTest[];
}

/** Cazurile ajung în `jsonb`, deci se citesc înapoi ca `unknown`. */
export function cazurile(e: Exercitiu): CazTest[] {
  return (e.cazuriTest ?? []) as CazTest[];
}

/** Pe ce motor se rulează. Rândurile scrise înainte de cursul de SQL n-au coloana. */
export function limbajul(e: Exercitiu): Limbaj {
  return e.limbaj === "sql" ? "sql" : "python";
}

export function briefingul(n: Nivel): EcranBriefing[] {
  const b = n.briefing as { ecrane?: EcranBriefing[] } | null;
  return b?.ecrane ?? [];
}

/**
 * Puntea peste pasul 11: o bază de dinainte are rânduri fără `cheie`. Se
 * completează o dată, potrivind cum se potrivea înainte — lecțiile după nume,
 * exercițiile după enunț. Ce nu se recunoaște rămâne fără cheie și e tratat
 * mai departe ca al nimănui: nu se șterge, doar nu se mai actualizează.
 */
async function leagaRandurileVechi(cap: { id: number }, livrat: CapitolLivrat) {
  const { baza } = await deschideBaza();

  const fataCheie = await baza
    .select()
    .from(nivel)
    .where(and(eq(nivel.capitolId, cap.id), isNull(nivel.cheie)));
  if (fataCheie.length === 0) return;

  for (const n of livrat.niveluri) {
    const vechi = fataCheie.find((v) => v.nume === n.nume);
    if (!vechi) continue;
    await baza
      .update(nivel)
      .set({ cheie: n.cheie })
      .where(eq(nivel.id, vechi.id));

    const exVechi = await baza
      .select()
      .from(exercitiu)
      .where(and(eq(exercitiu.nivelId, vechi.id), isNull(exercitiu.cheie)));
    for (const e of n.exercitii) {
      const potrivit = exVechi.find((v) => v.enunt === e.enunt);
      if (!potrivit) continue;
      await baza
        .update(exercitiu)
        .set({ cheie: e.cheie })
        .where(eq(exercitiu.id, potrivit.id));
    }
  }
}

async function idMaterie(nume: string, temaImplicita: string): Promise<number> {
  const { baza } = await deschideBaza();
  const existente = await baza
    .select()
    .from(materie)
    .where(eq(materie.nume, nume));
  if (existente[0]) {
    // O bază dinainte de pasul 25 are rândul fără temă implicită — se
    // completează la prima așezare de-acum, ca și restul conținutului livrat.
    if (existente[0].temaImplicita !== temaImplicita) {
      await baza.update(materie).set({ temaImplicita }).where(eq(materie.id, existente[0].id));
    }
    return existente[0].id;
  }

  const [noua] = await baza
    .insert(materie)
    .values({ nume, sursa: "livrat", temaImplicita })
    .returning();
  return noua.id;
}

/**
 * Tema implicită a fiecărui curs livrat — pasul 25 (`PLAN.md` §10): Python
 * ține tema „terminal" din capul locului, SQL primește „minimalistă" (o
 * limbă precisă, fără ornament). Materialul propriu e „caldă" — vezi
 * `materiaProprieRand`.
 */
const TEMA_CURSULUI: Record<CheieCursLivrat, string> = {
  python: "terminal",
  sql: "minimalista",
};

/**
 * Testul unei lecții sau al unui capitol. Una dintre cele două legături e
 * dată, cealaltă e nulă — rândul e unic pe fiecare, deci se poate reașeza
 * fără să se dubleze. Ca peste tot, ce a răspuns utilizatorul nu se atinge:
 * încercările trimit la `test.id`, iar `id`-ul rămâne al lui.
 */
async function asazaTestul(
  legatura: { nivelId: number } | { capitolId: number },
  livrat: TestLivrat | undefined,
) {
  if (!livrat) return;
  const { baza } = await deschideBaza();

  const unde =
    "nivelId" in legatura
      ? eq(test.nivelId, legatura.nivelId)
      : eq(test.capitolId, legatura.capitolId);

  const vechi = await baza.select().from(test).where(unde);
  const continut = {
    cheie: livrat.cheie,
    titlu: livrat.titlu,
    intrebari: livrat.intrebari,
  };

  if (vechi[0]) {
    await baza.update(test).set(continut).where(eq(test.id, vechi[0].id));
  } else {
    await baza.insert(test).values({ ...legatura, ...continut });
  }
}

async function asazaCapitolul(
  materieId: number,
  livrat: CapitolLivrat,
  ordineCapitol: number,
  limbaj: Limbaj,
) {
  const { baza } = await deschideBaza();

  const dupaCheie = await baza
    .select()
    .from(capitol)
    .where(and(eq(capitol.materieId, materieId), eq(capitol.cheie, livrat.cheie)));

  // O bază dinainte de pasul 11 are capitolul fără cheie; se recunoaște după
  // nume, o singură dată, și primește cheia.
  const faraCheie = dupaCheie[0]
    ? []
    : await baza
        .select()
        .from(capitol)
        .where(and(eq(capitol.materieId, materieId), isNull(capitol.cheie)))
        .orderBy(asc(capitol.ordine));

  const cap =
    dupaCheie[0] ??
    faraCheie.find((c) => c.nume === livrat.nume) ??
    (
      await baza
        .insert(capitol)
        .values({
          materieId,
          cheie: livrat.cheie,
          nume: livrat.nume,
          ordine: ordineCapitol,
        })
        .returning()
    )[0];

  await baza
    .update(capitol)
    .set({ cheie: livrat.cheie, nume: livrat.nume, ordine: ordineCapitol })
    .where(eq(capitol.id, cap.id));

  await leagaRandurileVechi(cap, livrat);

  const niveluriVechi = await baza
    .select()
    .from(nivel)
    .where(eq(nivel.capitolId, cap.id));

  const exercitiiVechi =
    niveluriVechi.length > 0
      ? await baza
          .select()
          .from(exercitiu)
          .where(
            inArray(
              exercitiu.nivelId,
              niveluriVechi.map((n) => n.id),
            ),
          )
      : [];

  let ordine = 0;
  for (const livratNivel of livrat.niveluri) {
    ordine += 1;
    const briefing = { ecrane: livratNivel.briefing };
    const vechi = niveluriVechi.find((n) => n.cheie === livratNivel.cheie);

    const nivelId = vechi
      ? (
          await baza
            .update(nivel)
            // `stare` nu se atinge: e progresul utilizatorului, nu conținut.
            .set({ nume: livratNivel.nume, ordine, briefing })
            .where(eq(nivel.id, vechi.id))
            .returning()
        )[0].id
      : (
          await baza
            .insert(nivel)
            .values({
              capitolId: cap.id,
              cheie: livratNivel.cheie,
              nume: livratNivel.nume,
              ordine,
              briefing,
              stare: ordine === 1 ? "deschis" : "blocat",
            })
            .returning()
        )[0].id;

    let ordineExercitiu = 0;
    for (const ex of livratNivel.exercitii) {
      ordineExercitiu += 1;
      const { cheie, ...continut } = ex;
      const deja = exercitiiVechi.find(
        (e) => e.cheie === cheie && e.nivelId === nivelId,
      );
      if (deja) {
        await baza
          .update(exercitiu)
          .set({ ...continut, limbaj, ordine: ordineExercitiu })
          .where(eq(exercitiu.id, deja.id));
      } else {
        await baza.insert(exercitiu).values({
          ...continut,
          limbaj,
          cheie,
          nivelId,
          ordine: ordineExercitiu,
        });
      }
    }

    await asazaTestul({ nivelId }, livratNivel.test);
  }

  await asazaTestul({ capitolId: cap.id }, livrat.test);
}

/**
 * Materia proprie (pasul 20) — una singură, cea pe care o umple graful de
 * concepte (`lib/import/concepte.ts`). Nu vine dintr-un fișier, deci `asaza`
 * n-are ce citi sau valida; doar găsește rândul, sau îl face dacă lipsește.
 */
async function materiaProprieRand() {
  const { baza } = await deschideBaza();
  const gasita = await baza
    .select()
    .from(materie)
    .where(eq(materie.sursa, "generat"));
  if (gasita[0]) {
    if (gasita[0].temaImplicita !== "calda") {
      await baza.update(materie).set({ temaImplicita: "calda" }).where(eq(materie.id, gasita[0].id));
      gasita[0].temaImplicita = "calda";
    }
    return gasita[0];
  }

  const [noua] = await baza
    .insert(materie)
    .values({ nume: "Materialul tău", sursa: "generat", temaImplicita: "calda" })
    .returning();
  return noua;
}

/** `id`-ul materiei proprii, creând-o dacă e prima dată. */
export async function materiaProprie(): Promise<number> {
  return (await materiaProprieRand()).id;
}

/** `id`-ul materiei proprii, sau `null` dacă n-a fost creată încă — nu inventă una. */
export async function materiaProprieDacaExista(): Promise<number | null> {
  const { baza } = await deschideBaza();
  const gasita = await baza
    .select()
    .from(materie)
    .where(eq(materie.sursa, "generat"));
  return gasita[0]?.id ?? null;
}

async function asaza(cheieCurs: CheieCurs): Promise<{
  materieId: number;
  curs: { materie: string };
}> {
  if (cheieCurs === CURS_PROPRIU) {
    const rand = await materiaProprieRand();
    await scrieMaterieActiva(rand.id);
    return { materieId: rand.id, curs: { materie: rand.nume } };
  }

  const curs = await cursLivrat(cheieCurs);
  const materieId = await idMaterie(curs.materie, TEMA_CURSULUI[cheieCurs as CheieCursLivrat]);
  let ordine = 0;
  for (const cap of curs.capitole) {
    ordine += 1;
    await asazaCapitolul(materieId, cap, ordine, curs.limbaj);
  }
  await scrieMaterieActiva(materieId);
  return { materieId, curs };
}

/**
 * O dată pe încărcarea filei. Așezarea e idempotentă, dar n-are rost s-o
 * refacem la fiecare ecran.
 */
const inLucru = new Map<string, Promise<{ materieId: number; curs: { materie: string } }>>();

function odataPePagina(cheieCurs: CheieCurs) {
  const deja = inLucru.get(cheieCurs);
  if (deja) return deja;
  const promisiune = asaza(cheieCurs).catch((e: unknown) => {
    inLucru.delete(cheieCurs);
    throw e;
  });
  inLucru.set(cheieCurs, promisiune);
  return promisiune;
}

/** Întoarce `id`-ul materiei, după ce s-a asigurat că e așezat cursul. */
export async function aplicaSeminte(
  cheieCurs: CheieCurs = CURS_IMPLICIT,
): Promise<number> {
  return (await odataPePagina(cheieCurs)).materieId;
}

/** Numele cursului livrat, așa cum apare pe ecran. */
export async function numeMateriei(
  cheieCurs: CheieCurs = CURS_IMPLICIT,
): Promise<string> {
  return (await odataPePagina(cheieCurs)).curs.materie;
}
