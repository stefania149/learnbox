/**
 * Enunțul personalizat al unui exercițiu — pasul 23 (`PLAN.md` §9).
 *
 * Un rând separat de `exercitiu`, niciodată o suprascriere a lui: vezi nota
 * din `lib/date/schema.ts`.
 */
import { eq } from "drizzle-orm";
import { deschideBaza } from "./client";
import { exercitiuPersonalizat } from "./schema";

export async function personalizarea(exercitiuId: number): Promise<string | null> {
  const { baza } = await deschideBaza();
  const rand = await baza
    .select()
    .from(exercitiuPersonalizat)
    .where(eq(exercitiuPersonalizat.exercitiuId, exercitiuId));
  return rand[0]?.enunt ?? null;
}

/** Personalizările tuturor exercițiilor unei lecții, dintr-o dată. */
export async function personalizarileLectiei(
  exercitiuIds: number[],
): Promise<Record<number, string>> {
  if (exercitiuIds.length === 0) return {};
  const { baza } = await deschideBaza();
  const toate = await baza.select().from(exercitiuPersonalizat);
  const ceSetul = new Set(exercitiuIds);
  return Object.fromEntries(
    toate.filter((r) => ceSetul.has(r.exercitiuId)).map((r) => [r.exercitiuId, r.enunt]),
  );
}

export async function salveazaPersonalizarea(
  exercitiuId: number,
  enunt: string,
): Promise<void> {
  const { baza } = await deschideBaza();
  await baza
    .insert(exercitiuPersonalizat)
    .values({ exercitiuId, enunt })
    .onConflictDoUpdate({
      target: exercitiuPersonalizat.exercitiuId,
      set: { enunt, creatLa: new Date() },
    });
}
