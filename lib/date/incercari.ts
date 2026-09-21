/**
 * Scrierea încercărilor. `incercare` e imutabilă (`PLAN.md` §11): fără UPDATE,
 * fără DELETE — o reluare e un rând nou. Istoricul greșelilor e ce face Arhiva
 * posibilă mai târziu.
 */
import { count, desc, eq, sql } from "drizzle-orm";
import { deschideBaza } from "./client";
import { incercare, xpTotal } from "./schema";
import type { Raport } from "@/lib/exercitii/motor";
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

/**
 * Scrie încercarea și adaugă XP-ul la totalul materiei. Întoarce socoteala, ca
 * ecranul să poată arăta din ce s-a adunat.
 */
export async function scrieIncercare({
  exercitiuId,
  materieId,
  cod,
  raport,
}: {
  exercitiuId: number;
  materieId: number;
  cod: string;
  raport: Raport;
}): Promise<{ socoteala: SocotealaXp; xpMaterie: number }> {
  const { baza } = await deschideBaza();

  const inainte = await numaraIncercari(exercitiuId);
  const socoteala = socotesteXp({
    trecute: raport.trecute,
    total: raport.total,
    esteAdouaOara: inainte > 0,
  });

  await baza.insert(incercare).values({
    exercitiuId,
    raspuns: cod,
    verdict: raport.verdict,
    cazuriTrecute: raport.trecute,
    cazuriTotal: raport.total,
    eroarePython: raport.eroarePython,
    xp: socoteala.total,
  });

  const [randXp] = await baza
    .insert(xpTotal)
    .values({ materieId, xp: socoteala.total })
    .onConflictDoUpdate({
      target: xpTotal.materieId,
      set: { xp: sql`${xpTotal.xp} + ${socoteala.total}` },
    })
    .returning();

  return { socoteala, xpMaterie: randXp.xp };
}
