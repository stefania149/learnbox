/**
 * Setările utilizatorului — un singur rând, `id = 1` (`PLAN.md` §11).
 * Registrele de ton sunt cele trei din §8; nu se inventează altele aici.
 */
import { eq } from "drizzle-orm";
import { deschideBaza } from "./client";
import { setari } from "./schema";

export const REGISTRE_TON = [
  {
    valoare: "jucaus",
    nume: "Jucăuș",
    explicatie: "Mascotă animată, exclamații, confetti.",
  },
  {
    valoare: "neutru",
    nume: "Neutru",
    explicatie: "O linie de text, fără personaj.",
  },
  {
    valoare: "sec",
    nume: "Sec",
    explicatie: "Cifra și atât.",
  },
] as const;

export type RegistruTon = (typeof REGISTRE_TON)[number]["valoare"];

export type Setari = typeof setari.$inferSelect;

/**
 * Citește setările, creând rândul cu valorile implicite dacă lipsește.
 * Inserția e idempotentă: două file deschise odată pot ajunge amândouă aici,
 * iar a doua nu trebuie să cadă pe cheie duplicată.
 */
export async function citesteSetari(): Promise<Setari> {
  const { baza } = await deschideBaza();

  await baza.insert(setari).values({ id: 1 }).onConflictDoNothing();

  const randuri = await baza.select().from(setari).where(eq(setari.id, 1));
  return randuri[0];
}

export async function scrieRegistruTon(registru: RegistruTon) {
  const { baza } = await deschideBaza();
  await citesteSetari();
  const scrise = await baza
    .update(setari)
    .set({ registruTon: registru })
    .where(eq(setari.id, 1))
    .returning();
  return scrise[0];
}

/**
 * Modelul s-a descărcat măcar o dată pe calculatorul ăsta (pasul 16). Se scrie
 * o singură dată, la primul succes — nu se stinge înapoi.
 */
export async function scrieModelDescarcat() {
  const { baza } = await deschideBaza();
  await citesteSetari();
  const scrise = await baza
    .update(setari)
    .set({ modelDescarcat: true })
    .where(eq(setari.id, 1))
    .returning();
  return scrise[0];
}

/**
 * Numele de pe ecranul de profil. Se șterge scriind un șir gol: profilul
 * merge și fără nume.
 */
export async function scrieNumeAfisat(nume: string) {
  const { baza } = await deschideBaza();
  await citesteSetari();
  const curat = nume.trim().slice(0, 40);
  const scrise = await baza
    .update(setari)
    .set({ numeAfisat: curat === "" ? null : curat })
    .where(eq(setari.id, 1))
    .returning();
  return scrise[0];
}
