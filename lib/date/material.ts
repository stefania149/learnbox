/**
 * Materialele importate — pasul 18. Nimic nu se leagă încă de curs: graful de
 * concepte și generarea vin la pașii 19-20.
 */
import { desc, sql } from "drizzle-orm";
import { deschideBaza } from "./client";
import { chunk, material } from "./schema";
import type { BucataText } from "@/lib/import/bucati";

export type MaterialListat = {
  id: number;
  titlu: string;
  fisier: string;
  tip: string;
  importatLa: Date;
  bucati: number;
};

/** Scrie materialul și bucățile lui, cu embeddingurile deja calculate. */
export async function scrieMaterialul({
  titlu,
  fisier,
  bucati,
}: {
  titlu: string;
  fisier: string;
  bucati: (BucataText & { embedding: number[] })[];
}): Promise<number> {
  const { baza } = await deschideBaza();

  const [randMaterial] = await baza
    .insert(material)
    .values({ titlu, fisier, tip: "pdf" })
    .returning();

  for (const b of bucati) {
    await baza.insert(chunk).values({
      materialId: randMaterial.id,
      text: b.text,
      pagina: b.pagina,
      embedding: b.embedding,
    });
  }

  return randMaterial.id;
}

export async function listaMaterialelor(): Promise<MaterialListat[]> {
  const { baza } = await deschideBaza();

  const materiale = await baza
    .select()
    .from(material)
    .orderBy(desc(material.importatLa));

  const numarate = await baza
    .select({ materialId: chunk.materialId, n: sql<number>`count(*)` })
    .from(chunk)
    .groupBy(chunk.materialId);
  const bucatiPe = new Map(numarate.map((r) => [r.materialId, Number(r.n)]));

  return materiale.map((m) => ({
    id: m.id,
    titlu: m.titlu,
    fisier: m.fisier,
    tip: m.tip,
    importatLa: m.importatLa,
    bucati: bucatiPe.get(m.id) ?? 0,
  }));
}
