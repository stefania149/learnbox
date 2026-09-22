/**
 * Harta cursului și starea lecțiilor.
 *
 * Adevărul stă în `incercare`, care e imutabilă; `progres_nivel` e rezumatul
 * scris după fiecare rulare, ca ecranele să nu recalculeze tot de fiecare dată.
 *
 * O lecție se termină când **fiecare exercițiu al ei a fost încercat** — nu
 * când toate trec. XP-ul măsoară efortul, nu corectitudinea (regula 4), deci
 * nici deblocarea nu se leagă de corectitudine.
 */
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { deschideBaza } from "./client";
import {
  capitol,
  exercitiu,
  incercare,
  nivel,
  progresNivel,
  setari,
} from "./schema";
import { aplicaSeminte, type Exercitiu, type Nivel } from "./seminte";
import { adaugaXp, citesteXpTotal } from "./incercari";
import { PAUZA_ORE, XP } from "@/lib/exercitii/xp";

export type StareNivel = "terminat" | "deschis" | "blocat";

export type NivelHarta = {
  id: number;
  nume: string;
  ordine: number;
  exercitii: number;
  incercate: number;
  xp: number;
  stare: StareNivel;
  briefingCitit: boolean;
};

export type CapitolHarta = {
  id: number;
  nume: string;
  ordine: number;
  niveluri: NivelHarta[];
};

export type Harta = {
  materieId: number;
  materie: string;
  xp: number;
  capitole: CapitolHarta[];
};

/** Toate exercițiile și încercările materiei, grupate pe lecții. */
async function socoteli(materieId: number) {
  const { baza } = await deschideBaza();

  const capitole = await baza
    .select()
    .from(capitol)
    .where(eq(capitol.materieId, materieId))
    .orderBy(asc(capitol.ordine));

  const niveluri = await baza
    .select()
    .from(nivel)
    .where(
      inArray(
        nivel.capitolId,
        capitole.map((c) => c.id),
      ),
    )
    .orderBy(asc(nivel.ordine), asc(nivel.id));

  const exercitii = await baza
    .select()
    .from(exercitiu)
    .where(
      inArray(
        exercitiu.nivelId,
        niveluri.map((n) => n.id),
      ),
    );

  const incercari = await baza
    .select({ exercitiuId: incercare.exercitiuId, xp: incercare.xp })
    .from(incercare);

  const progrese = await baza.select().from(progresNivel);
  const briefinguri = new Map(
    progrese.map((p) => [p.nivelId, p.briefingCitit]),
  );

  const xpPeExercitiu = new Map<number, number>();
  const incercatele = new Set<number>();
  for (const i of incercari) {
    if (i.exercitiuId === null) continue;
    incercatele.add(i.exercitiuId);
    xpPeExercitiu.set(
      i.exercitiuId,
      (xpPeExercitiu.get(i.exercitiuId) ?? 0) + i.xp,
    );
  }

  return {
    capitole,
    niveluri,
    exercitii,
    xpPeExercitiu,
    incercatele,
    briefinguri,
  };
}

export async function hartaCursului(): Promise<Harta> {
  const materieId = await aplicaSeminte();
  const { capitole, niveluri, exercitii, xpPeExercitiu, incercatele, briefinguri } =
    await socoteli(materieId);

  // Lecțiile se deblochează în ordine (`PLAN.md` §5): prima e deschisă, iar
  // fiecare următoare se deschide când cea dinaintea ei s-a terminat.
  let deblocata = true;

  const hartaNiveluri = new Map<number, NivelHarta[]>();
  for (const n of niveluri) {
    const aleNivelului = exercitii.filter((e) => e.nivelId === n.id);
    const incercate = aleNivelului.filter((e) => incercatele.has(e.id)).length;
    const briefingCitit = briefinguri.get(n.id) ?? false;
    const xp =
      aleNivelului.reduce((s, e) => s + (xpPeExercitiu.get(e.id) ?? 0), 0) +
      (briefingCitit ? XP.briefing : 0);
    const terminat = aleNivelului.length > 0 && incercate === aleNivelului.length;

    const stare: StareNivel = terminat
      ? "terminat"
      : deblocata
        ? "deschis"
        : "blocat";
    deblocata = terminat;

    const lista = hartaNiveluri.get(n.capitolId) ?? [];
    lista.push({
      id: n.id,
      nume: n.nume,
      ordine: n.ordine,
      exercitii: aleNivelului.length,
      incercate,
      xp,
      stare,
      briefingCitit,
    });
    hartaNiveluri.set(n.capitolId, lista);
  }

  return {
    materieId,
    materie: "Python",
    xp: await citesteXpTotal(materieId),
    capitole: capitole.map((c) => ({
      id: c.id,
      nume: c.nume,
      ordine: c.ordine,
      niveluri: hartaNiveluri.get(c.id) ?? [],
    })),
  };
}

export type Lectie = {
  nivel: Nivel;
  exercitii: Exercitiu[];
  incercate: Set<number>;
  materieId: number;
};

/** Lecția cerută, cu exercițiile ei și cu ce s-a încercat deja din ele. */
export async function citesteLectie(nivelId: number): Promise<Lectie | null> {
  const materieId = await aplicaSeminte();
  const { baza } = await deschideBaza();

  const gasit = await baza.select().from(nivel).where(eq(nivel.id, nivelId));
  if (!gasit[0]) return null;

  // Ordinea stă în coloană de la pasul 11; înainte se lua din fișierul de
  // conținut, fiindcă `id` crește și un exercițiu adăugat târziu cădea la
  // coadă. Cele fără ordine (dintr-o bază veche, nerecunoscute) merg la urmă.
  const exercitii = (
    await baza.select().from(exercitiu).where(eq(exercitiu.nivelId, nivelId))
  ).sort(
    (a, b) =>
      (a.ordine ?? Number.MAX_SAFE_INTEGER) -
      (b.ordine ?? Number.MAX_SAFE_INTEGER),
  );

  const incercari = await baza
    .select({ exercitiuId: incercare.exercitiuId })
    .from(incercare)
    .where(
      inArray(
        incercare.exercitiuId,
        exercitii.map((e) => e.id),
      ),
    );

  return {
    nivel: gasit[0],
    exercitii,
    incercate: new Set(
      incercari.map((i) => i.exercitiuId).filter((i): i is number => i !== null),
    ),
    materieId,
  };
}

/**
 * Scrie rezumatul lecției după o încercare. `incercare` rămâne neatinsă —
 * aici se actualizează doar rândul de progres.
 */
export async function scrieProgresNivel(nivelId: number): Promise<StareNivel> {
  const { baza } = await deschideBaza();

  const exercitii = await baza
    .select()
    .from(exercitiu)
    .where(eq(exercitiu.nivelId, nivelId));

  const incercari = await baza
    .select({ exercitiuId: incercare.exercitiuId, xp: incercare.xp })
    .from(incercare)
    .where(
      inArray(
        incercare.exercitiuId,
        exercitii.map((e) => e.id),
      ),
    );

  const vechi = await baza
    .select()
    .from(progresNivel)
    .where(eq(progresNivel.nivelId, nivelId));
  const briefingCitit = vechi[0]?.briefingCitit ?? false;

  const incercate = new Set(incercari.map((i) => i.exercitiuId));
  const xp =
    incercari.reduce((s, i) => s + i.xp, 0) +
    (briefingCitit ? XP.briefing : 0);
  const terminat = exercitii.length > 0 && incercate.size === exercitii.length;
  const stare = terminat ? "terminat" : "in-lucru";

  await baza
    .insert(progresNivel)
    .values({
      nivelId,
      stare,
      xpObtinut: xp,
      terminatLa: terminat ? new Date() : null,
      briefingCitit,
    })
    .onConflictDoUpdate({
      target: progresNivel.nivelId,
      set: {
        stare,
        xpObtinut: xp,
        terminatLa: terminat ? new Date() : null,
      },
    });

  return terminat ? "terminat" : "deschis";
}

/**
 * XP pentru briefingul citit: mic, garantat, o singură dată pe lecție
 * (`PLAN.md` §8). Întoarce XP-ul dat — `0` dacă fusese dat deja.
 */
export async function insemneazaBriefingCitit(
  nivelId: number,
  materieId: number,
): Promise<number> {
  const { baza } = await deschideBaza();

  const scrise = await baza
    .insert(progresNivel)
    .values({
      nivelId,
      stare: "briefing",
      xpObtinut: XP.briefing,
      briefingCitit: true,
    })
    .onConflictDoUpdate({
      target: progresNivel.nivelId,
      set: {
        briefingCitit: true,
        xpObtinut: sql`${progresNivel.xpObtinut} + ${XP.briefing}`,
      },
      // Al doilea drum prin briefing nu mai dă XP.
      setWhere: eq(progresNivel.briefingCitit, false),
    })
    .returning();

  if (scrise.length === 0) return 0;

  await adaugaXp(materieId, XP.briefing);
  return XP.briefing;
}

export type RandIstoric = {
  id: number;
  exercitiu: string;
  lectie: string;
  trecute: number | null;
  total: number | null;
  xp: number;
  cand: Date;
};

/** Ultimele încercări, cele mai noi întâi. Nimic nu se șterge vreodată. */
export async function istoricIncercari(cate = 12): Promise<RandIstoric[]> {
  const { baza } = await deschideBaza();

  const randuri = await baza
    .select({
      id: incercare.id,
      enunt: exercitiu.enunt,
      tip: exercitiu.tip,
      lectie: nivel.nume,
      trecute: incercare.cazuriTrecute,
      total: incercare.cazuriTotal,
      xp: incercare.xp,
      cand: incercare.creatLa,
    })
    .from(incercare)
    .innerJoin(exercitiu, eq(incercare.exercitiuId, exercitiu.id))
    .innerJoin(nivel, eq(exercitiu.nivelId, nivel.id))
    .orderBy(desc(incercare.creatLa), desc(incercare.id))
    .limit(cate);

  return randuri.map((r) => ({
    id: r.id,
    exercitiu: r.enunt.split(".")[0],
    lectie: r.lectie,
    trecute: r.trecute,
    total: r.total,
    xp: r.xp,
    cand: r.cand,
  }));
}

/**
 * Bonusul de revenire (`PLAN.md` §8): dacă n-ai mai intrat de o vreme, se
 * adaugă XP și se merge mai departe. **Tăcut** — nu se anunță pe ecran.
 */
export async function bonusDeRevenire(materieId: number): Promise<number> {
  const { baza } = await deschideBaza();

  await baza.insert(setari).values({ id: 1 }).onConflictDoNothing();
  const randuri = await baza.select().from(setari).where(eq(setari.id, 1));
  const inainte = randuri[0]?.vazutUltimaData ?? null;
  const acum = new Date();

  await baza
    .update(setari)
    .set({ vazutUltimaData: acum })
    .where(eq(setari.id, 1));

  if (!inainte) return 0;
  const ore = (acum.getTime() - inainte.getTime()) / 3_600_000;
  if (ore < PAUZA_ORE) return 0;

  await adaugaXp(materieId, XP.revenire);
  return XP.revenire;
}
