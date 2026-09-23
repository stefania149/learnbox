/**
 * Rezolvă tema „auto" în tema implicită a cursului curent — pasul 25.
 * Fișier separat, nu în `lib/date/setari.ts` sau `lib/date/seminte.ts`:
 * amândouă se importă una pe alta (`scrieMaterieActiva`), iar asta ar face
 * un ciclu dacă rezolvarea ar sta acolo. Interoghează baza direct, la nivelul
 * cel mai jos.
 */
import { eq } from "drizzle-orm";
import { deschideBaza } from "@/lib/date/client";
import { materie } from "@/lib/date/schema";
import { TEMA_AUTOMATA, TEMA_IMPLICITA, temaValida, type Tema } from "./teme";

export async function temaCurenta(
  temaActiva: string,
  materieActiva: number | null,
): Promise<Tema> {
  if (temaActiva !== TEMA_AUTOMATA) return temaValida(temaActiva);
  if (materieActiva === null) return TEMA_IMPLICITA;

  const { baza } = await deschideBaza();
  const rand = await baza.select().from(materie).where(eq(materie.id, materieActiva));
  return temaValida(rand[0]?.temaImplicita);
}
