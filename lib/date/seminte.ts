/**
 * Aducerea bazei locale la zi cu ce scrie în capitolul livrat.
 *
 * Merge ca migrările: un pachet se aplică o dată și se trece în
 * `samanta_aplicata`. Conținutul nou înseamnă pachet nou, nu rescrierea celui
 * vechi — `incercare` trimite la exercițiile livrate și istoricul nu se pierde
 * (`PLAN.md` §11).
 *
 * Potrivirea cu ce e deja în bază se face după nume (lecțiile) și după enunț
 * (exercițiile), fiindcă schema n-are chei stabile de conținut. Vin la pasul
 * 11, odată cu formatul de curs livrat.
 */
import { asc, eq, inArray } from "drizzle-orm";
import { deschideBaza } from "./client";
import { capitol, exercitiu, materie, nivel, samantaAplicata } from "./schema";
import { CAPITOL } from "@/lib/continut/functii-si-bucle";
import type { CazTest } from "@/lib/exercitii/motor";
import type { EcranBriefing } from "@/lib/continut/functii-si-bucle";

export type { EcranBriefing };
export type Exercitiu = typeof exercitiu.$inferSelect;
export type Nivel = typeof nivel.$inferSelect;

export const NUME_MATERIE = "Python";

/** Numele pachetului. Se schimbă când se schimbă conținutul livrat. */
const PACHET = "python-functii-si-bucle-1";

/**
 * Ordinea exercițiilor în lecție e cea din capitolul livrat, nu cea din bază:
 * schema n-are coloană de ordine pe `exercitiu`, iar un exercițiu adăugat mai
 * târziu ar cădea la coadă doar fiindcă are `id` mai mare.
 */
const ORDINEA = new Map(
  CAPITOL.niveluri
    .flatMap((n) => n.exercitii)
    .map((e, i) => [e.enunt, i] as const),
);

export function ordineaLivrata(enunt: string): number {
  return ORDINEA.get(enunt) ?? Number.MAX_SAFE_INTEGER;
}

/** Cazurile ajung în `jsonb`, deci se citesc înapoi ca `unknown`. */
export function cazurile(e: Exercitiu): CazTest[] {
  return (e.cazuriTest ?? []) as CazTest[];
}

export function briefingul(n: Nivel): EcranBriefing[] {
  const b = n.briefing as { ecrane?: EcranBriefing[] } | null;
  return b?.ecrane ?? [];
}

async function idMaterie(): Promise<number> {
  const { baza } = await deschideBaza();
  const existente = await baza
    .select()
    .from(materie)
    .where(eq(materie.nume, NUME_MATERIE));
  if (existente[0]) return existente[0].id;

  const [noua] = await baza
    .insert(materie)
    .values({ nume: NUME_MATERIE, sursa: "livrat" })
    .returning();
  return noua.id;
}

/** Rulează pachetul o singură dată, pe viață de bază de date. */
async function odata(nume: string, treaba: () => Promise<void>) {
  const { baza } = await deschideBaza();
  const scris = await baza
    .insert(samantaAplicata)
    .values({ nume })
    .onConflictDoNothing()
    .returning();
  if (scris.length === 0) return;

  try {
    await treaba();
  } catch (e) {
    // Dacă pachetul n-a intrat, nu-l însemnăm ca intrat.
    await baza.delete(samantaAplicata).where(eq(samantaAplicata.nume, nume));
    throw e;
  }
}

/**
 * Pune în bază capitolul din `lib/continut`, fără să șteargă nimic: lecțiile
 * și exercițiile care există se aduc la zi, cele care lipsesc se adaugă. Un
 * exercițiu mutat între lecții își păstrează încercările.
 */
async function asazaCapitolul(materieId: number) {
  const { baza } = await deschideBaza();

  const capitole = await baza
    .select()
    .from(capitol)
    .where(eq(capitol.materieId, materieId))
    .orderBy(asc(capitol.ordine));

  const cap =
    capitole[0] ??
    (
      await baza
        .insert(capitol)
        .values({ materieId, nume: CAPITOL.nume, ordine: 1 })
        .returning()
    )[0];

  if (cap.nume !== CAPITOL.nume) {
    await baza
      .update(capitol)
      .set({ nume: CAPITOL.nume })
      .where(eq(capitol.id, cap.id));
  }

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
  for (const livrat of CAPITOL.niveluri) {
    ordine += 1;
    const briefing = { ecrane: livrat.briefing };
    const vechi = niveluriVechi.find((n) => n.nume === livrat.nume);

    const nivelId = vechi
      ? (await baza
          .update(nivel)
          .set({ ordine, briefing })
          .where(eq(nivel.id, vechi.id))
          .returning())[0].id
      : (
          await baza
            .insert(nivel)
            .values({
              capitolId: cap.id,
              nume: livrat.nume,
              ordine,
              briefing,
              stare: ordine === 1 ? "deschis" : "blocat",
            })
            .returning()
        )[0].id;

    for (const ex of livrat.exercitii) {
      const deja = exercitiiVechi.find((e) => e.enunt === ex.enunt);
      if (deja) {
        await baza
          .update(exercitiu)
          .set({ ...ex, nivelId })
          .where(eq(exercitiu.id, deja.id));
      } else {
        await baza.insert(exercitiu).values({ ...ex, nivelId });
      }
    }
  }
}

export async function aplicaSeminte(): Promise<number> {
  const materieId = await idMaterie();
  await odata(PACHET, () => asazaCapitolul(materieId));
  return materieId;
}
