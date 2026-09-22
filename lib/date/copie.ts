/**
 * Copia progresului: un fișier scris de tine, citit tot de tine. Pasul 9 din
 * `PLAN.md` §13, și singurul drum prin care progresul pleacă de pe calculator
 * — nu există server și nu există cont (`PLAN.md` §3).
 *
 * Fișierul nu conține cursul. Cursul vine cu aplicația, deci se scrie doar ce
 * ai făcut tu: încercările, briefingurile citite, XP-ul și setările.
 *
 * De la pasul 11, legătura cu exercițiile se face după `cheie` — numele
 * stabil din fișierul de curs. Enunțul și numele lecției rămân scrise în
 * copie, din două motive: se citește de om, și un fișier de versiunea 1, de
 * dinainte de chei, se poate încă lega după ele.
 *
 * De la pasul 13 sunt mai multe cursuri livrate, deci fișierul ține o listă
 * de cursuri, nu unul singur (versiunea 3). Fișierele de versiunea 1 și 2 se
 * citesc mai departe: ce scriau în rădăcină se socotește drept cursul
 * implicit, fiindcă atunci altul nici nu exista.
 *
 * La citire nu se șterge nimic. `incercare` e imutabilă (regula 8): o
 * încercare din fișier care nu e în bază se adaugă ca rând nou, una care e
 * deja acolo se sare. XP-ul rezultat nu poate fi mai mic decât cel de dinainte
 * (regula 4).
 */
import { asc, eq, inArray, or } from "drizzle-orm";
import { deschideBaza } from "./client";
import {
  capitol,
  exercitiu,
  incercare,
  nivel,
  progresNivel,
  setari,
  test,
} from "./schema";
import { aplicaSeminte, numeMateriei } from "./seminte";
import {
  CURSURI_LIVRATE,
  CURS_IMPLICIT,
  type CheieCurs,
} from "@/lib/continut/livrate";
import { adaugaXp, citesteXpTotal } from "./incercari";
import { citesteSetari } from "./setari";
import { scrieProgresNivel } from "./progres";
import { XP } from "@/lib/exercitii/xp";

export const FORMAT = "tutore-progres";
export const VERSIUNE = 4;
/** Versiunile pe care aplicația încă știe să le citească. */
const CITIBILE = [1, 2, 3, 4];

export type IncercareCopie = {
  /** Cheia stabilă a exercițiului. Lipsește în fișierele de versiunea 1. */
  cheie: string | null;
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
  cheie: string | null;
  nume: string;
  briefingCitit: boolean;
};

/** O trecere prin testul unei lecții sau al unui capitol (pasul 14). */
export type IncercareTestCopie = {
  /** Cheia stabilă a testului. Lipsește în fișierele scrise înainte de v4. */
  cheie: string | null;
  titlu: string;
  /** Ce s-a bifat, ca JSON — aceeași formă ca în bază. */
  raspuns: string | null;
  corecte: number | null;
  total: number | null;
  xp: number;
  cand: string;
};

/**
 * Un curs, cu tot ce ai făcut în el. De la versiunea 3 fișierul ține o listă
 * de blocuri ca ăsta: cu două cursuri livrate, o copie care ar scrie doar
 * cursul deschis ar arunca în tăcere progresul de la celălalt.
 */
export type CursCopie = {
  /** Cheia fișierului de curs: „python", „sql". */
  cheie: string;
  /** Numele de pe ecran, ca să se citească de om. */
  materie: string;
  xp: number;
  lectii: LectieCopie[];
  incercari: IncercareCopie[];
  /** De la versiunea 4. Fișierele mai vechi n-au testele, deci vine goală. */
  incercariTest: IncercareTestCopie[];
};

export type FisierCopie = {
  format: typeof FORMAT;
  versiune: number;
  scrisLa: string;
  setari: {
    numeAfisat: string | null;
    registruTon: string;
    temaActiva: string;
  };
  cursuri: CursCopie[];
};

/** Testele materiei: ale lecțiilor ei și ale capitolelor ei. */
async function testeleMateriei(capitole: number[], niveluri: number[]) {
  const { baza } = await deschideBaza();
  if (capitole.length === 0 && niveluri.length === 0) return [];

  return baza
    .select()
    .from(test)
    .where(
      or(
        capitole.length > 0 ? inArray(test.capitolId, capitole) : undefined,
        niveluri.length > 0 ? inArray(test.nivelId, niveluri) : undefined,
      ),
    );
}

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

  return { capitole, niveluri, exercitii };
}

// —— Scrierea copiei ———————————————————————————————————————————

export async function faceCopie(): Promise<FisierCopie> {
  const ale = await citesteSetari();

  return {
    format: FORMAT,
    versiune: VERSIUNE,
    scrisLa: new Date().toISOString(),
    setari: {
      numeAfisat: ale.numeAfisat,
      registruTon: ale.registruTon,
      temaActiva: ale.temaActiva,
    },
    // Toate cursurile livrate, nu doar cel deschis. Unul pe care nu l-ai
    // atins iese cu liste goale, și nu supără pe nimeni.
    cursuri: await Promise.all(CURSURI_LIVRATE.map(scrieCursul)),
  };
}

async function scrieCursul(cheieCurs: CheieCurs): Promise<CursCopie> {
  const materieId = await aplicaSeminte(cheieCurs);
  const { baza } = await deschideBaza();

  const { capitole, niveluri, exercitii } = await continutulMateriei(materieId);
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

  const teste = await testeleMateriei(
    capitole.map((c) => c.id),
    niveluri.map((n) => n.id),
  );
  const dupaIdTest = new Map(teste.map((t) => [t.id, t]));
  const incercariTest =
    teste.length > 0
      ? await baza
          .select()
          .from(incercare)
          .where(
            inArray(
              incercare.testId,
              teste.map((t) => t.id),
            ),
          )
          .orderBy(asc(incercare.creatLa), asc(incercare.id))
      : [];

  return {
    cheie: cheieCurs,
    materie: await numeMateriei(cheieCurs),
    xp: await citesteXpTotal(materieId),
    lectii: niveluri.map((n) => ({
      cheie: n.cheie,
      nume: n.nume,
      briefingCitit: briefinguri.get(n.id) ?? false,
    })),
    incercari: incercari.flatMap((i) => {
      const ex = i.exercitiuId === null ? undefined : dupaId.get(i.exercitiuId);
      if (!ex) return [];
      return [
        {
          cheie: ex.cheie,
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
    incercariTest: incercariTest.flatMap((i) => {
      const t = i.testId === null ? undefined : dupaIdTest.get(i.testId);
      if (!t) return [];
      return [
        {
          cheie: t.cheie,
          titlu: t.titlu ?? "",
          raspuns: i.raspuns,
          corecte: i.cazuriTrecute,
          total: i.cazuriTotal,
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

  if (typeof f.versiune !== "number" || !CITIBILE.includes(f.versiune)) {
    throw new Error(
      `Copia e scrisă în versiunea ${String(f.versiune)}, iar aplicația citește ${CITIBILE.join(" și ")}.`,
    );
  }

  // Versiunile 1 și 2 aveau un singur curs, scris direct în rădăcina
  // fișierului. Se împachetează ca un bloc, și de aici încolo drumul e unul.
  const blocuri: unknown[] =
    f.versiune >= 3
      ? Array.isArray(f.cursuri)
        ? f.cursuri
        : []
      : [{ cheie: CURS_IMPLICIT, materie: f.materie, xp: f.xp, lectii: f.lectii, incercari: f.incercari }];

  if (f.versiune >= 3 && !Array.isArray(f.cursuri)) {
    throw new Error("Copia e incompletă: îi lipsesc cursurile.");
  }

  return {
    format: FORMAT,
    // Se ține versiunea din fișier: de ea depinde după ce se leagă mai jos.
    versiune: f.versiune,
    scrisLa: typeof f.scrisLa === "string" ? f.scrisLa : "",
    setari: setarile(f.setari),
    cursuri: blocuri.map(citesteCursul),
  };
}

function citesteCursul(v: unknown): CursCopie {
  if (typeof v !== "object" || v === null) {
    throw new Error("Copia are un curs care nu se poate citi.");
  }
  const f = v as Record<string, unknown>;

  if (!Array.isArray(f.incercari) || !Array.isArray(f.lectii)) {
    throw new Error("Copia e incompletă: îi lipsesc încercările sau lecțiile.");
  }

  return {
    cheie: typeof f.cheie === "string" ? f.cheie : CURS_IMPLICIT,
    materie: typeof f.materie === "string" ? f.materie : "—",
    xp: intreg(f.xp),
    lectii: f.lectii.flatMap((l): LectieCopie[] => {
      if (typeof l !== "object" || l === null) return [];
      const r = l as Record<string, unknown>;
      if (typeof r.nume !== "string") return [];
      return [
        {
          cheie: sirSauNimic(r.cheie),
          nume: r.nume,
          briefingCitit: r.briefingCitit === true,
        },
      ];
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
          cheie: sirSauNimic(r.cheie),
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
    // Lipsesc în fișierele scrise înainte de versiunea 4; atunci nu existau.
    incercariTest: (Array.isArray(f.incercariTest) ? f.incercariTest : []).flatMap(
      (i): IncercareTestCopie[] => {
        if (typeof i !== "object" || i === null) return [];
        const r = i as Record<string, unknown>;
        if (typeof r.cand !== "string" || Number.isNaN(Date.parse(r.cand))) {
          return [];
        }
        return [
          {
            cheie: sirSauNimic(r.cheie),
            titlu: typeof r.titlu === "string" ? r.titlu : "",
            raspuns: sirSauNimic(r.raspuns),
            corecte: numarSauNimic(r.corecte),
            total: numarSauNimic(r.total),
            xp: intreg(r.xp),
            cand: r.cand,
          },
        ];
      },
    ),
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
  /** Treceri prin teste aduse din fișier (pasul 14). */
  testeAdaugate: number;
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
  const total: RaportCopie = {
    incercariAdaugate: 0,
    incercariDejaAvute: 0,
    briefinguriAdaugate: 0,
    testeAdaugate: 0,
    exercitiiNecunoscute: 0,
    xpInainte: 0,
    xpDupa: 0,
  };

  for (const bloc of copie.cursuri) {
    // Un curs din fișier pe care aplicația nu-l mai livrează nu se poate lega
    // de nimic. Nu e o eroare — e un curs scos între timp — dar încercările
    // lui se numără, ca să nu dispară tăcut din raport.
    if (!(CURSURI_LIVRATE as readonly string[]).includes(bloc.cheie)) {
      total.exercitiiNecunoscute += bloc.incercari.length;
      continue;
    }

    const r = await aplicaCursul(bloc.cheie as CheieCurs, bloc, copie.setari);
    total.incercariAdaugate += r.incercariAdaugate;
    total.incercariDejaAvute += r.incercariDejaAvute;
    total.briefinguriAdaugate += r.briefinguriAdaugate;
    total.testeAdaugate += r.testeAdaugate;
    total.exercitiiNecunoscute += r.exercitiiNecunoscute;
    total.xpInainte += r.xpInainte;
    total.xpDupa += r.xpDupa;
  }

  return total;
}

async function aplicaCursul(
  cheieCurs: CheieCurs,
  copie: CursCopie,
  aleSetari: FisierCopie["setari"],
): Promise<RaportCopie> {
  const materieId = await aplicaSeminte(cheieCurs);
  const { baza } = await deschideBaza();

  const { capitole, niveluri, exercitii } = await continutulMateriei(materieId);
  const nivelulExercitiului = new Map(exercitii.map((e) => [e.id, e.nivelId]));

  // Două hărți, în ordinea în care se încearcă: cheia e adevărul, enunțul e
  // puntea către fișierele de versiunea 1 și către bazele nemigrate încă.
  const nivelDupaCheie = new Map(
    niveluri.flatMap((n) => (n.cheie ? [[n.cheie, n.id] as const] : [])),
  );
  const nivelDupaNume = new Map(niveluri.map((n) => [n.nume, n.id]));
  const dupaCheie = new Map(
    exercitii.flatMap((e) => (e.cheie ? [[e.cheie, e.id] as const] : [])),
  );
  const dupaEnunt = new Map(exercitii.map((e) => [e.enunt, e.id]));

  const gasesteExercitiul = (i: IncercareCopie): number | undefined =>
    (i.cheie === null ? undefined : dupaCheie.get(i.cheie)) ??
    dupaEnunt.get(i.exercitiu);

  const gasesteLectia = (l: LectieCopie): number | undefined =>
    (l.cheie === null ? undefined : nivelDupaCheie.get(l.cheie)) ??
    nivelDupaNume.get(l.nume);

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
    const exercitiuId = gasesteExercitiul(i);
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
    const nivelId = gasesteLectia(l);
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

  // Trecerile prin teste (pasul 14). Se leagă după cheia testului, care nu se
  // schimbă, și se sar cele pe care baza le are deja — aceeași regulă ca la
  // exerciții: aditiv, niciodată peste.
  let testeAdaugate = 0;
  const teste = await testeleMateriei(
    capitole.map((c) => c.id),
    niveluri.map((n) => n.id),
  );
  const testDupaCheie = new Map(
    teste.flatMap((t) => (t.cheie ? [[t.cheie, t.id] as const] : [])),
  );

  const testeAvute =
    teste.length > 0
      ? await baza
          .select({ testId: incercare.testId, creatLa: incercare.creatLa })
          .from(incercare)
          .where(
            inArray(
              incercare.testId,
              teste.map((t) => t.id),
            ),
          )
      : [];
  const amDejaTest = new Set(
    testeAvute.map((i) => `${i.testId}|${i.creatLa.getTime()}`),
  );

  for (const i of copie.incercariTest) {
    const testId = i.cheie === null ? undefined : testDupaCheie.get(i.cheie);
    if (testId === undefined) continue;

    const cand = new Date(i.cand);
    const semn = `${testId}|${cand.getTime()}`;
    if (amDejaTest.has(semn)) continue;

    await baza.insert(incercare).values({
      testId,
      raspuns: i.raspuns,
      verdict:
        i.corecte !== null && i.total !== null && i.corecte === i.total
          ? "corect"
          : (i.corecte ?? 0) > 0
            ? "partial"
            : "niciunul",
      cazuriTrecute: i.corecte,
      cazuriTotal: i.total,
      xp: i.xp,
      creatLa: cand,
    });
    amDejaTest.add(semn);
    testeAdaugate += 1;
  }

  // Setările vin din copie doar dacă fișierul chiar le are.
  const noiSetari: Partial<typeof setari.$inferInsert> = {};
  if (aleSetari.registruTon) noiSetari.registruTon = aleSetari.registruTon;
  if (aleSetari.temaActiva) noiSetari.temaActiva = aleSetari.temaActiva;
  if (aleSetari.numeAfisat) noiSetari.numeAfisat = aleSetari.numeAfisat;
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
    testeAdaugate,
    exercitiiNecunoscute,
    xpInainte,
    xpDupa,
  };
}

/** XP-ul care se poate reconstitui din rândurile materiei. */
async function xpDinBaza(materieId: number): Promise<number> {
  const { baza } = await deschideBaza();
  const { capitole, niveluri, exercitii } = await continutulMateriei(materieId);

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

  // Și trecerile prin teste, de la pasul 14: fără ele, XP-ul reconstituit ar
  // ieși mai mic decât cel adevărat, iar o restaurare l-ar trage în jos.
  const teste = await testeleMateriei(
    capitole.map((c) => c.id),
    niveluri.map((n) => n.id),
  );
  const incercariTest =
    teste.length > 0
      ? await baza
          .select({ xp: incercare.xp })
          .from(incercare)
          .where(
            inArray(
              incercare.testId,
              teste.map((t) => t.id),
            ),
          )
      : [];

  const progrese = await baza.select().from(progresNivel);
  const aleMateriei = new Set(niveluri.map((n) => n.id));
  const briefinguri = progrese.filter(
    (p) => p.briefingCitit && aleMateriei.has(p.nivelId),
  ).length;

  return (
    incercari.reduce((s, i) => s + i.xp, 0) +
    incercariTest.reduce((s, i) => s + i.xp, 0) +
    briefinguri * XP.briefing
  );
}
