/**
 * Scrierea încercărilor. `incercare` e imutabilă (`PLAN.md` §11): fără UPDATE,
 * fără DELETE — o reluare e un rând nou. Istoricul greșelilor e ce face Arhiva
 * posibilă mai târziu.
 */
import { count, desc, eq, sql } from "drizzle-orm";
import { deschideBaza } from "./client";
import { incercare, xpTotal } from "./schema";
import { socotesteXp, type SocotealaXp } from "@/lib/exercitii/xp";

export type Incercare = typeof incercare.$inferSelect;

export async function numaraIncercari(exercitiuId: number): Promise<number> {
  const { baza } = await deschideBaza();
  const randuri = await baza
    .select({ n: count() })
    .from(incercare)
    .where(eq(incercare.exercitiuId, exercitiuId));
  return randuri[0].n;
}

export async function ultimeleIncercari(
  exercitiuId: number,
  cate = 5,
): Promise<Incercare[]> {
  const { baza } = await deschideBaza();
  return baza
    .select()
    .from(incercare)
    .where(eq(incercare.exercitiuId, exercitiuId))
    .orderBy(desc(incercare.creatLa), desc(incercare.id))
    .limit(cate);
}

export async function citesteXpTotal(materieId: number): Promise<number> {
  const { baza } = await deschideBaza();
  const randuri = await baza
    .select()
    .from(xpTotal)
    .where(eq(xpTotal.materieId, materieId));
  return randuri[0]?.xp ?? 0;
}

/** Adaugă XP la totalul materiei. Niciodată cu număr negativ (regula 4). */
export async function adaugaXp(
  materieId: number,
  xp: number,
): Promise<number> {
  const { baza } = await deschideBaza();
  const [rand] = await baza
    .insert(xpTotal)
    .values({ materieId, xp })
    .onConflictDoUpdate({
      target: xpTotal.materieId,
      set: { xp: sql`${xpTotal.xp} + ${xp}` },
    })
    .returning();
  return rand.xp;
}

/**
 * Scrie încercarea și adaugă XP-ul la totalul materiei. Întoarce socoteala, ca
 * ecranul să poată arăta din ce s-a adunat.
 *
 * Generică față de motor: cazuri de test, verificare SQL sau puncte de
 * rubrică (pasul 27) — toate se reduc la „câte au trecut din câte erau", ceea
 * ce e tot ce-i trebuie XP-ului (`lib/exercitii/xp.ts`).
 */
export async function scrieIncercare({
  exercitiuId,
  materieId,
  raspuns,
  verdict,
  trecute,
  total,
  eroarePython = null,
}: {
  exercitiuId: number;
  materieId: number;
  raspuns: string;
  verdict: string;
  trecute: number;
  total: number;
  eroarePython?: string | null;
}): Promise<{ socoteala: SocotealaXp; xpMaterie: number }> {
  const { baza } = await deschideBaza();

  const inainte = await numaraIncercari(exercitiuId);
  const socoteala = socotesteXp({ trecute, total, esteAdouaOara: inainte > 0 });

  await baza.insert(incercare).values({
    exercitiuId,
    raspuns,
    verdict,
    cazuriTrecute: trecute,
    cazuriTotal: total,
    eroarePython,
    xp: socoteala.total,
  });

  const xpMaterie = await adaugaXp(materieId, socoteala.total);

  return { socoteala, xpMaterie };
}
