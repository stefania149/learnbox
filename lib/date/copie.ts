/**
 * Copia progresului: un fișier scris de tine, citit tot de tine. Pasul 9 din
 * `PLAN.md` §13, și singurul drum prin care progresul pleacă de pe calculator
 * — nu există server și nu există cont (`PLAN.md` §3).
 *
 * Fișierul nu conține cursul. Cursul vine cu aplicația, deci se scrie doar ce
 * ai făcut tu: încercările, briefingurile citite, XP-ul și setările. Legătura
 * cu exercițiile se face după numele lecției și după enunț, ca la semințe —
 * schema n-are chei stabile de conținut până la pasul 11.
 *
 * La citire nu se șterge nimic. `incercare` e imutabilă (regula 8): o
 * încercare din fișier care nu e în bază se adaugă ca rând nou, una care e
 * deja acolo se sare. XP-ul rezultat nu poate fi mai mic decât cel de dinainte
 * (regula 4).
 */
import { asc, eq, inArray } from "drizzle-orm";
import { deschideBaza } from "./client";
import {
  capitol,
  exercitiu,
  incercare,
  nivel,
  progresNivel,
  setari,
} from "./schema";
import { aplicaSeminte, NUME_MATERIE } from "./seminte";
import { adaugaXp, citesteXpTotal } from "./incercari";
import { citesteSetari } from "./setari";
import { scrieProgresNivel } from "./progres";
import { XP } from "@/lib/exercitii/xp";

export const FORMAT = "tutore-progres";
export const VERSIUNE = 1;

export type IncercareCopie = {
  lectie: string;
  exercitiu: string;
  raspuns: string | null;
  verdict: string | null;
  cazuriTrecute: number | null;
  cazuriTotal: number | null;
  eroarePython: string | null;
  xp: number;
  cand: string;
};

export type LectieCopie = {
  nume: string;
  briefingCitit: boolean;
};

export type FisierCopie = {
  format: typeof FORMAT;
  versiune: number;
  scrisLa: string;
  materie: string;
  xp: number;
  setari: {
    numeAfisat: string | null;
    registruTon: string;
    temaActiva: string;
  };
  lectii: LectieCopie[];
  incercari: IncercareCopie[];
};

/** Lecțiile și exercițiile materiei, o dată, ca să nu le cerem de trei ori. */
async function continutulMateriei(materieId: number) {
  const { baza } = await deschideBaza();

  const capitole = await baza
    .select()
    .from(capitol)
    .where(eq(capitol.materieId, materieId))
    .orderBy(asc(capitol.ordine));

  const niveluri =
    capitole.length > 0
      ? await baza
          .select()
          .from(nivel)
          .where(
            inArray(
              nivel.capitolId,
              capitole.map((c) => c.id),
            ),
          )
          .orderBy(asc(nivel.ordine), asc(nivel.id))
      : [];

  const exercitii =
    niveluri.length > 0
      ? await baza
          .select()
          .from(exercitiu)
          .where(
            inArray(
              exercitiu.nivelId,
              niveluri.map((n) => n.id),
            ),
          )
      : [];

  return { niveluri, exercitii };
}

// —— Scrierea copiei ———————————————————————————————————————————

export async function faceCopie(): Promise<FisierCopie> {
  const materieId = await aplicaSeminte();
  const { baza } = await deschideBaza();

  const { niveluri, exercitii } = await continutulMateriei(materieId);
  const numeLectie = new Map(niveluri.map((n) => [n.id, n.nume]));
  const dupaId = new Map(exercitii.map((e) => [e.id, e]));

  const incercari =
    exercitii.length > 0
      ? await baza
          .select()
          .from(incercare)
          .where(
            inArray(
              incercare.exercitiuId,
              exercitii.map((e) => e.id),
            ),
          )
          .orderBy(asc(incercare.creatLa), asc(incercare.id))
      : [];

  const progrese = await baza.select().from(progresNivel);
  const briefinguri = new Map(progrese.map((p) => [p.nivelId, p.briefingCitit]));

  const ale = await citesteSetari();

  return {
    format: FORMAT,
    versiune: VERSIUNE,
    scrisLa: new Date().toISOString(),
    materie: NUME_MATERIE,
    xp: await citesteXpTotal(materieId),
    setari: {
      numeAfisat: ale.numeAfisat,
      registruTon: ale.registruTon,
      temaActiva: ale.temaActiva,
    },
    lectii: niveluri.map((n) => ({
      nume: n.nume,
      briefingCitit: briefinguri.get(n.id) ?? false,
    })),
    incercari: incercari.flatMap((i) => {
      const ex = i.exercitiuId === null ? undefined : dupaId.get(i.exercitiuId);
      if (!ex) return [];
      return [
        {
          lectie: numeLectie.get(ex.nivelId) ?? "",
          exercitiu: ex.enunt,
          raspuns: i.raspuns,
          verdict: i.verdict,
          cazuriTrecute: i.cazuriTrecute,
          cazuriTotal: i.cazuriTotal,
          eroarePython: i.eroarePython,
          xp: i.xp,
          cand: i.creatLa.toISOString(),
        },
      ];
    }),
  };
}

/** `tutore-progres-2026-09-21.json`. Data în nume, ca să se poată ține mai multe. */
export function numeFisier(cand = new Date()): string {
  const zi = [
    cand.getFullYear(),
    String(cand.getMonth() + 1).padStart(2, "0"),
    String(cand.getDate()).padStart(2, "0"),
  ].join("-");
  return `tutore-progres-${zi}.json`;
}

export function textCopie(copie: FisierCopie): string {
  return JSON.stringify(copie, null, 2);
}

// —— Citirea copiei ————————————————————————————————————————————

/**
 * Verifică fișierul înainte să atingem baza. Mesajele spun ce e de făcut, nu
 * doar că nu merge: cine ajunge aici tocmai a ratat o restaurare.
 */
export function citesteCopie(text: string): FisierCopie {
  let brut: unknown;
  try {
    brut = JSON.parse(text);
  } catch {
    throw new Error(
      "Fișierul nu e JSON. Alege fișierul scris de Tutore, nu altul.",
    );
  }

  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) {
    throw new Error("Fișierul nu are forma unei copii de progres.");
  }

  const f = brut as Record<string, unknown>;

  if (f.format !== FORMAT) {
    throw new Error(
      "Fișierul nu e o copie de progres Tutore: îi lipsește marcajul de format.",
    );
  }

  if (f.versiune !== VERSIUNE) {
    throw new Error(
      `Copia e scrisă în versiunea ${String(f.versiune)}, iar aplicația citește versiunea ${VERSIUNE}.`,
    );
  }

  if (!Array.isArray(f.incercari) || !Array.isArray(f.lectii)) {
    throw new Error("Copia e incompletă: îi lipsesc încercările sau lecțiile.");
  }

  return {
    format: FORMAT,
    versiune: VERSIUNE,
    scrisLa: typeof f.scrisLa === "string" ? f.scrisLa : "",
    materie: typeof f.materie === "string" ? f.materie : NUME_MATERIE,
    xp: intreg(f.xp),
    setari: setarile(f.setari),
    lectii: f.lectii.flatMap((l): LectieCopie[] => {
      if (typeof l !== "object" || l === null) return [];
      const r = l as Record<string, unknown>;
      if (typeof r.nume !== "string") return [];
      return [{ nume: r.nume, briefingCitit: r.briefingCitit === true }];
    }),
    incercari: f.incercari.flatMap((i): IncercareCopie[] => {
      if (typeof i !== "object" || i === null) return [];
      const r = i as Record<string, unknown>;
      if (typeof r.exercitiu !== "string" || typeof r.cand !== "string") {
        return [];
      }
      if (Number.isNaN(Date.parse(r.cand))) return [];
      return [
        {
          lectie: typeof r.lectie === "string" ? r.lectie : "",
          exercitiu: r.exercitiu,
          raspuns: sirSauNimic(r.raspuns),
          verdict: sirSauNimic(r.verdict),
          cazuriTrecute: numarSauNimic(r.cazuriTrecute),
          cazuriTotal: numarSauNimic(r.cazuriTotal),
          eroarePython: sirSauNimic(r.eroarePython),
          xp: intreg(r.xp),
          cand: r.cand,
        },
      ];
    }),
  };
}

/** XP-ul e întreg și nu e negativ, oriunde ar veni de (regula 4). */
function intreg(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v)
    ? Math.max(0, Math.round(v))
    : 0;
}

function numarSauNimic(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}

function sirSauNimic(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function setarile(v: unknown): FisierCopie["setari"] {
  const gol = { numeAfisat: null, registruTon: "", temaActiva: "" };
  if (typeof v !== "object" || v === null) return gol;
  const r = v as Record<string, unknown>;
  return {
    numeAfisat: sirSauNimic(r.numeAfisat),
    registruTon: typeof r.registruTon === "string" ? r.registruTon : "",
    temaActiva: typeof r.temaActiva === "string" ? r.temaActiva : "",
  };
}

export type RaportCopie = {
  incercariAdaugate: number;
  incercariDejaAvute: number;
  briefinguriAdaugate: number;
  exercitiiNecunoscute: number;
  xpInainte: number;
  xpDupa: number;
};

/**
 * Pune copia în bază. Aditiv: nu se șterge și nu se rescrie nimic din ce e
 * deja aici, deci o copie mai veche decât baza nu strică nimic — doar nu
 * adaugă mare lucru.
 */
export async function aplicaCopie(copie: FisierCopie): Promise<RaportCopie> {
  const materieId = await aplicaSeminte();
  const { baza } = await deschideBaza();

  const { niveluri, exercitii } = await continutulMateriei(materieId);
  const dupaNume = new Map(niveluri.map((n) => [n.nume, n.id]));
  const nivelulExercitiului = new Map(exercitii.map((e) => [e.id, e.nivelId]));
  const dupaEnunt = new Map(exercitii.map((e) => [e.enunt, e.id]));

  const xpInainte = await citesteXpTotal(materieId);

  const existente =
    exercitii.length > 0
      ? await baza
          .select({
            exercitiuId: incercare.exercitiuId,
            creatLa: incercare.creatLa,
          })
          .from(incercare)
          .where(
            inArray(
              incercare.exercitiuId,
              exercitii.map((e) => e.id),
            ),
          )
      : [];

  // O încercare e aceeași dacă e la același exercițiu, în aceeași clipă.
  const amDeja = new Set(
    existente.map((i) => `${i.exercitiuId}|${i.creatLa.getTime()}`),
  );

  let incercariAdaugate = 0;
  let incercariDejaAvute = 0;
  let exercitiiNecunoscute = 0;
  const atinse = new Set<number>();

  for (const i of copie.incercari) {
    const exercitiuId = dupaEnunt.get(i.exercitiu);
    if (exercitiuId === undefined) {
      exercitiiNecunoscute += 1;
      continue;
    }

    const cand = new Date(i.cand);
    const cheie = `${exercitiuId}|${cand.getTime()}`;
    if (amDeja.has(cheie)) {
      incercariDejaAvute += 1;
      continue;
    }

    await baza.insert(incercare).values({
      exercitiuId,
      raspuns: i.raspuns,
      verdict: i.verdict,
      cazuriTrecute: i.cazuriTrecute,
      cazuriTotal: i.cazuriTotal,
      eroarePython: i.eroarePython,
      xp: i.xp,
      creatLa: cand,
    });
    amDeja.add(cheie);
    incercariAdaugate += 1;

    const nivelId = nivelulExercitiului.get(exercitiuId);
    if (nivelId !== undefined) atinse.add(nivelId);
  }

  // Briefingul citit se aprinde, niciodată nu se stinge.
  let briefinguriAdaugate = 0;
  for (const l of copie.lectii) {
    if (!l.briefingCitit) continue;
    const nivelId = dupaNume.get(l.nume);
    if (nivelId === undefined) continue;

    const scrise = await baza
      .insert(progresNivel)
      .values({ nivelId, stare: "briefing", briefingCitit: true })
      .onConflictDoUpdate({
        target: progresNivel.nivelId,
        set: { briefingCitit: true },
        setWhere: eq(progresNivel.briefingCitit, false),
      })
      .returning();

    if (scrise.length > 0) {
      briefinguriAdaugate += 1;
      atinse.add(nivelId);
    }
  }

  for (const nivelId of atinse) {
    await scrieProgresNivel(nivelId);
  }

  // Setările vin din copie doar dacă fișierul chiar le are.
  const noiSetari: Partial<typeof setari.$inferInsert> = {};
  if (copie.setari.registruTon) noiSetari.registruTon = copie.setari.registruTon;
  if (copie.setari.temaActiva) noiSetari.temaActiva = copie.setari.temaActiva;
  if (copie.setari.numeAfisat) noiSetari.numeAfisat = copie.setari.numeAfisat;
  if (Object.keys(noiSetari).length > 0) {
    await citesteSetari();
    await baza.update(setari).set(noiSetari).where(eq(setari.id, 1));
  }

  // XP-ul se aduce la cel mai mare dintre: cât era, cât scrie în copie, și cât
  // iese din rândurile care sunt acum în bază. Nu scade niciodată (regula 4).
  const dinBaza = await xpDinBaza(materieId);
  const tinta = Math.max(xpInainte, copie.xp, dinBaza);
  const xpDupa =
    tinta > xpInainte ? await adaugaXp(materieId, tinta - xpInainte) : xpInainte;

  return {
    incercariAdaugate,
    incercariDejaAvute,
    briefinguriAdaugate,
    exercitiiNecunoscute,
    xpInainte,
    xpDupa,
  };
}

/** XP-ul care se poate reconstitui din rândurile materiei. */
async function xpDinBaza(materieId: number): Promise<number> {
  const { baza } = await deschideBaza();
  const { niveluri, exercitii } = await continutulMateriei(materieId);

  const incercari =
    exercitii.length > 0
      ? await baza
          .select({ xp: incercare.xp })
          .from(incercare)
          .where(
            inArray(
              incercare.exercitiuId,
              exercitii.map((e) => e.id),
            ),
          )
      : [];

  const progrese = await baza.select().from(progresNivel);
  const aleMateriei = new Set(niveluri.map((n) => n.id));
  const briefinguri = progrese.filter(
    (p) => p.briefingCitit && aleMateriei.has(p.nivelId),
  ).length;

  return incercari.reduce((s, i) => s + i.xp, 0) + briefinguri * XP.briefing;
}
