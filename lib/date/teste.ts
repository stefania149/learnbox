/**
 * Testele de lecție și de capitol — pasul 14.
 *
 * Un test e un set de întrebări cu variante, scrise în cursul livrat. Se
 * răspunde din interfață, iar verdictul se dă comparând numere: varianta
 * aleasă cu varianta corectă. **Niciun model** (principiul 1), deci merge pe
 * un laptop care n-a descărcat nimic (principiul 5).
 *
 * Testul nu blochează nimic. Lecțiile se deschid mai departe după practică
 * (`PLAN.md` §5, Î-14); testul se poate sări, se poate relua, și de fiecare
 * dată plătește XP, fiindcă o reluare e tot efort (`PLAN.md` §8).
 */
import { desc, eq, inArray, or } from "drizzle-orm";
import { deschideBaza } from "./client";
import { capitol, incercare, nivel, test } from "./schema";
import { aplicaSeminte, intrebarile, type Test } from "./seminte";
import { adaugaXp } from "./incercari";
import { socotesteXpTest, type SocotealaXp } from "@/lib/exercitii/xp";
import { CURS_IMPLICIT, type CheieCurs } from "@/lib/continut/livrate";
import type { IntrebareTest } from "@/lib/continut/format";

export type TestDeschis = {
  id: number;
  titlu: string;
  intrebari: IntrebareTest[];
  esteCapitol: boolean;
  /** De câte ori a mai fost dus până la capăt. */
  duseInainte: number;
  materieId: number;
};

/** Ce s-a răspuns la o întrebare: indicele variantei, sau nimic. */
export type Raspunsuri = (number | null)[];

export type RaportTest = {
  corecte: number;
  total: number;
  socoteala: SocotealaXp;
  xpMaterie: number;
};

async function deschide(
  unde: ReturnType<typeof eq>,
  esteCapitol: boolean,
  cheieCurs: CheieCurs,
): Promise<TestDeschis | null> {
  const materieId = await aplicaSeminte(cheieCurs);
  const { baza } = await deschideBaza();

  const randuri = await baza.select().from(test).where(unde);
  const gasit: Test | undefined = randuri[0];
  if (!gasit) return null;

  const intrebari = intrebarile(gasit);
  if (intrebari.length === 0) return null;

  const duse = await baza
    .select({ id: incercare.id })
    .from(incercare)
    .where(eq(incercare.testId, gasit.id));

  return {
    id: gasit.id,
    titlu: gasit.titlu ?? "Test",
    intrebari,
    esteCapitol,
    duseInainte: duse.length,
    materieId,
  };
}

/** Testul lecției, dacă lecția are unul. */
export function testulLectiei(
  nivelId: number,
  cheieCurs: CheieCurs = CURS_IMPLICIT,
): Promise<TestDeschis | null> {
  return deschide(eq(test.nivelId, nivelId), false, cheieCurs);
}

/** Testul capitolului, dacă are unul. */
export function testulCapitolului(
  capitolId: number,
  cheieCurs: CheieCurs = CURS_IMPLICIT,
): Promise<TestDeschis | null> {
  return deschide(eq(test.capitolId, capitolId), true, cheieCurs);
}

/** Care teste ale capitolului au fost duse până la capăt măcar o dată. */
export async function testeleDuse(idTeste: number[]): Promise<Set<number>> {
  if (idTeste.length === 0) return new Set();
  const { baza } = await deschideBaza();

  const randuri = await baza
    .select({ testId: incercare.testId })
    .from(incercare)
    .where(inArray(incercare.testId, idTeste));

  return new Set(
    randuri.map((r) => r.testId).filter((id): id is number => id !== null),
  );
}

/** Testele capitolului și ale lecțiilor lui, în ordinea în care se dau. */
export async function testeleCapitolului(
  capitolId: number,
  niveluri: number[],
): Promise<{ id: number; nivelId: number | null; titlu: string }[]> {
  const { baza } = await deschideBaza();

  const randuri = await baza
    .select({ id: test.id, nivelId: test.nivelId, titlu: test.titlu })
    .from(test)
    .where(
      or(
        eq(test.capitolId, capitolId),
        niveluri.length > 0 ? inArray(test.nivelId, niveluri) : undefined,
      ),
    );

  return randuri.map((r) => ({ ...r, titlu: r.titlu ?? "Test" }));
}

/** Toate testele materiei: ale capitolelor ei și ale lecțiilor lor. */
async function testeleMateriei(materieId: number) {
  const { baza } = await deschideBaza();

  const capitole = await baza
    .select({ id: capitol.id })
    .from(capitol)
    .where(eq(capitol.materieId, materieId));
  if (capitole.length === 0) return [];

  const niveluri = await baza
    .select({ id: nivel.id })
    .from(nivel)
    .where(
      inArray(
        nivel.capitolId,
        capitole.map((c) => c.id),
      ),
    );

  return baza
    .select({ id: test.id })
    .from(test)
    .where(
      or(
        inArray(
          test.capitolId,
          capitole.map((c) => c.id),
        ),
        niveluri.length > 0
          ? inArray(
              test.nivelId,
              niveluri.map((n) => n.id),
            )
          : undefined,
      ),
    );
}

export type ProgresTesteMaterie = { duse: number; total: number; toateDuse: boolean };

/**
 * Cât din testele materiei au fost duse măcar o dată — condiția Arhivei
 * (`PLAN.md` §5, §8: „Testele îți deschid Arhiva de la final."). O materie
 * fără niciun test nu se deschide niciodată — n-are ce s-o deschidă.
 */
export async function progresTesteMaterie(
  materieId: number,
): Promise<ProgresTesteMaterie> {
  const teste = await testeleMateriei(materieId);
  const duse = await testeleDuse(teste.map((t) => t.id));
  return {
    duse: duse.size,
    total: teste.length,
    toateDuse: teste.length > 0 && duse.size === teste.length,
  };
}

/** Ultima încercare la testul ăsta, ca ecranul să arate unde ai rămas. */
export async function ultimulRezultat(testId: number) {
  const { baza } = await deschideBaza();
  const randuri = await baza
    .select()
    .from(incercare)
    .where(eq(incercare.testId, testId))
    .orderBy(desc(incercare.creatLa), desc(incercare.id))
    .limit(1);
  return randuri[0] ?? null;
}

/**
 * Scrie încercarea la test și adaugă XP-ul. Ca la exerciții, rândul e nou de
 * fiecare dată: `incercare` nu se editează niciodată (principiul 8).
 */
export async function scrieIncercareTest({
  testul,
  raspunsuri,
}: {
  testul: TestDeschis;
  raspunsuri: Raspunsuri;
}): Promise<RaportTest> {
  const { baza } = await deschideBaza();

  const corecte = testul.intrebari.filter(
    (intrebare, i) => raspunsuri[i] === intrebare.corect,
  ).length;
  const total = testul.intrebari.length;

  const socoteala = socotesteXpTest({
    corecte,
    esteCapitol: testul.esteCapitol,
  });

  await baza.insert(incercare).values({
    testId: testul.id,
    // Ce a ales, în ordinea întrebărilor. Se păstrează ca text, ca tot ce
    // scrie utilizatorul, și e citibil mai târziu de Arhivă.
    raspuns: JSON.stringify(raspunsuri),
    verdict: corecte === total ? "corect" : corecte > 0 ? "partial" : "niciunul",
    cazuriTrecute: corecte,
    cazuriTotal: total,
    xp: socoteala.total,
  });

  const xpMaterie = await adaugaXp(testul.materieId, socoteala.total);

  return { corecte, total, socoteala, xpMaterie };
}
