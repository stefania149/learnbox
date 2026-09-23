/**
 * Accesul la conversație și memorie — pasul 21 (`PLAN.md` §9, §11).
 *
 * O singură conversație globală, nu una per curs: asistentul e o unealtă care
 * răspunde la întrebări despre materie, nu un personaj cu context separat pe
 * ecran. Memoria reține numai fapte care schimbă conținutul (`CLAUDE.md`
 * regula 10) — extragerea lor stă în `lib/asistent/extrage.ts`.
 */
import { asc, eq, isNull } from "drizzle-orm";
import { deschideBaza } from "./client";
import { conversatie, memorie } from "./schema";

export type Rol = "utilizator" | "asistent";
export type Mesaj = typeof conversatie.$inferSelect;
export type Fapt = typeof memorie.$inferSelect;

export async function istoricConversatiei(): Promise<Mesaj[]> {
  const { baza } = await deschideBaza();
  return baza.select().from(conversatie).orderBy(asc(conversatie.creatLa));
}

export async function scrieMesajul(rol: Rol, text: string): Promise<Mesaj> {
  const { baza } = await deschideBaza();
  const [rand] = await baza.insert(conversatie).values({ rol, text }).returning();
  return rand;
}

/** Faptele active — cele șterse rămân în bază, dar nu se mai arată. */
export async function faptele(): Promise<Fapt[]> {
  const { baza } = await deschideBaza();
  return baza
    .select()
    .from(memorie)
    .where(isNull(memorie.stersLa))
    .orderBy(asc(memorie.creatLa));
}

export async function adaugaFaptul(tip: string, continut: string): Promise<void> {
  const { baza } = await deschideBaza();
  await baza.insert(memorie).values({ tip, continut });
}

/**
 * Ștergerea unui fapt — pasul 22 (`PLAN.md` §9: „vizibilă și editabilă",
 * `CLAUDE.md` regula 10). `stersLa`, nu `DELETE`: rândul rămâne, ca să nu fie
 * reextras imediat din aceeași conversație (`lib/date/schema.ts`).
 */
export async function stergeFaptul(id: number): Promise<void> {
  const { baza } = await deschideBaza();
  await baza.update(memorie).set({ stersLa: new Date() }).where(eq(memorie.id, id));
}
