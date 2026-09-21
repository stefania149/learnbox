/**
 * Conținutul livrat cu aplicația, ca pachete numerotate.
 *
 * Merge ca migrările: un pachet se aplică o dată și se trece în
 * `samanta_aplicata`. Nu se rescrie peste el, fiindcă `incercare` trimite la
 * exercițiile lui și istoricul nu se pierde (`PLAN.md` §11).
 *
 * Capitolul adevărat de Python se scrie la pasul 8. Ce e aici ține navigarea
 * pe picioare: două lecții, ca deblocarea în ordine să aibă ce debloca.
 */
import { and, asc, eq } from "drizzle-orm";
import { deschideBaza } from "./client";
import { capitol, exercitiu, materie, nivel, samantaAplicata } from "./schema";
import type { CazTest } from "@/lib/exercitii/motor";

export type Exercitiu = typeof exercitiu.$inferSelect;
export type Nivel = typeof nivel.$inferSelect;

/** Un ecran de briefing: teorie minimă, 2-4 ecrane pe lecție (`PLAN.md` §5). */
export type EcranBriefing = { titlu: string; text: string; cod?: string };

export const NUME_MATERIE = "Python";

/** Cazurile ajung în `jsonb`, deci se citesc înapoi ca `unknown`. */
export function cazurile(e: Exercitiu): CazTest[] {
  return (e.cazuriTest ?? []) as CazTest[];
}

export function briefingul(n: Nivel): EcranBriefing[] {
  const b = n.briefing as { ecrane?: EcranBriefing[] } | null;
  return b?.ecrane ?? [];
}

// —— Pachetul 1: capitolul „Primele funcții" —————————————————————

const EXERCITII_NIVEL_1 = [
  {
    tip: "completeaza",
    enunt:
      "Funcția `dublu` trebuie să întoarcă numărul primit, înmulțit cu doi. " +
      "Completează golul.",
    codInitial: `def dublu(n):
    return n * ___
`,
    solutie: `def dublu(n):
    return n * 2
`,
    cazuriTest: [
      { apel: "dublu(3)", asteptat: "6" },
      { apel: "dublu(0)", asteptat: "0" },
      { apel: "dublu(-4)", asteptat: "-8" },
    ],
    explicatiePredefinita:
      "`___` nu e cod Python, e semnul golului: Python nu știe ce e și se " +
      "oprește cu `NameError`. Pune în locul lui numărul cerut.",
  },
  {
    tip: "repara",
    enunt:
      "`maxim` trebuie să întoarcă cel mai mare număr dintr-o listă. Merge " +
      "pe numere pozitive, dar nu și pe negative. Repar-o.",
    codInitial: `def maxim(numere):
    cel_mai_mare = 0
    for n in numere:
        if n > cel_mai_mare:
            cel_mai_mare = n
    return cel_mai_mare
`,
    solutie: `def maxim(numere):
    cel_mai_mare = numere[0]
    for n in numere:
        if n > cel_mai_mare:
            cel_mai_mare = n
    return cel_mai_mare
`,
    cazuriTest: [
      { apel: "maxim([1, 5, 3])", asteptat: "5" },
      { apel: "maxim([2])", asteptat: "2" },
      { apel: "maxim([0, -3])", asteptat: "0" },
      { apel: "maxim([-4, -1, -7])", asteptat: "-1" },
    ],
    explicatiePredefinita:
      "Pornirea de la `0` presupune că lista are măcar un număr pozitiv. " +
      "Când toate sunt negative, `0` rămâne cel mai mare și iese un număr " +
      "care nici nu era în listă. Pornește de la primul element.",
  },
  {
    tip: "scrie",
    enunt:
      "Scrie `suma`, care întoarce suma numerelor primite. Antetul e dat; " +
      "corpul e al tău.",
    codInitial: `def suma(numere):
    ...
`,
    solutie: `def suma(numere):
    total = 0
    for n in numere:
        total += n
    return total
`,
    cazuriTest: [
      { apel: "suma([1, 2, 3])", asteptat: "6" },
      { apel: "suma([])", asteptat: "0" },
      { apel: "suma([-1, 1])", asteptat: "0" },
      { apel: "suma([0.5, 0.5])", asteptat: "1.0" },
      { apel: "suma(range(1000))", asteptat: "499500" },
    ],
    explicatiePredefinita:
      "Două capcane: lista goală trebuie să dea `0`, nu eroare; iar " +
      "`0.5 + 0.5` dă `1.0`, nu `1` — Python ține minte că a socotit cu " +
      "zecimale, iar cazul cere exact `1.0`.",
  },
];

const BRIEFING_NIVEL_1: EcranBriefing[] = [
  {
    titlu: "O funcție e un nume pus pe niște treabă",
    text:
      "Scrii o dată cum se face ceva, îi dai un nume, și de atunci o chemi pe " +
      "nume. `def` începe definiția, parantezele spun ce primește.",
    cod: `def dublu(n):
    return n * 2

dublu(21)`,
  },
  {
    titlu: "`return` trimite răspunsul înapoi",
    text:
      "Fără `return`, funcția face treaba și nu-ți dă nimic — primești `None`. " +
      "Asta e greșeala numărul unu la început, și nu dă niciun fel de eroare: " +
      "codul pare că merge, dar rezultatul lipsește.",
    cod: `def dublu(n):
    n * 2        # face înmulțirea și o aruncă

print(dublu(21))  # None`,
  },
  {
    titlu: "Cum se verifică",
    text:
      "Fiecare exercițiu vine cu cazuri de test: se cheamă funcția ta cu niște " +
      "valori și se compară rezultatul cu cel așteptat. Compararea e strictă — " +
      "`1` și `1.0` sunt răspunsuri diferite. Nu te judecă nimeni, se rulează cod.",
  },
];

// —— Pachetul 2: lecția a doua ————————————————————————————————

const BRIEFING_NIVEL_2: EcranBriefing[] = [
  {
    titlu: "`for` trece prin listă, element cu element",
    text:
      "Nu numeri tu pozițiile: `for` îți dă pe rând fiecare element. Ce scrii " +
      "indentat sub el se întâmplă o dată pentru fiecare.",
    cod: `for n in [3, 1, 4]:
    print(n)`,
  },
  {
    titlu: "Un acumulator ține minte între pași",
    text:
      "Bucla uită tot la fiecare pas, așa că ce vrei să păstrezi ții într-o " +
      "variabilă pornită înainte de buclă — un total, un contor, o listă nouă.",
    cod: `cate = 0
for n in [3, 1, 4]:
    cate += 1
print(cate)`,
  },
  {
    titlu: "Restul împărțirii spune dacă e par",
    text:
      "`%` dă restul. Un număr e par când restul împărțirii la doi e zero. " +
      "Merge și pe negative: `-4 % 2` e tot `0`.",
    cod: `7 % 2   # 1, deci impar
8 % 2   # 0, deci par`,
  },
];

const EXERCITII_NIVEL_2 = [
  {
    tip: "completeaza",
    enunt:
      "`cate_pare` numără câte numere pare sunt în listă. Completează golul " +
      "din condiție.",
    codInitial: `def cate_pare(numere):
    cate = 0
    for n in numere:
        if n % 2 == ___:
            cate += 1
    return cate
`,
    solutie: `def cate_pare(numere):
    cate = 0
    for n in numere:
        if n % 2 == 0:
            cate += 1
    return cate
`,
    cazuriTest: [
      { apel: "cate_pare([1, 2, 3, 4])", asteptat: "2" },
      { apel: "cate_pare([])", asteptat: "0" },
      { apel: "cate_pare([2, 4, 6])", asteptat: "3" },
      { apel: "cate_pare([-2, -1])", asteptat: "1" },
    ],
    explicatiePredefinita:
      "`n % 2` dă restul împărțirii la doi: `0` pentru numere pare, `1` " +
      "pentru impare. Condiția trebuie să compare restul cu `0`.",
  },
  {
    tip: "scrie",
    enunt:
      "Scrie `dubleaza`, care întoarce o listă nouă, cu fiecare număr " +
      "înmulțit cu doi. Lista primită rămâne neatinsă.",
    codInitial: `def dubleaza(numere):
    ...
`,
    solutie: `def dubleaza(numere):
    rezultat = []
    for n in numere:
        rezultat.append(n * 2)
    return rezultat
`,
    cazuriTest: [
      { apel: "dubleaza([1, 2, 3])", asteptat: "[2, 4, 6]" },
      { apel: "dubleaza([])", asteptat: "[]" },
      { apel: "dubleaza([-1, 0])", asteptat: "[-2, 0]" },
    ],
    explicatiePredefinita:
      "Două lucruri se uită des aici: lista nouă trebuie pornită goală " +
      "înainte de buclă (`rezultat = []`), și trebuie întoarsă la final cu " +
      "`return`. Fără `return`, iese `None`.",
  },
];

// —— Aplicarea ————————————————————————————————————————————————

async function idMaterie(): Promise<number> {
  const { baza } = await deschideBaza();
  const existente = await baza
    .select()
    .from(materie)
    .where(eq(materie.nume, NUME_MATERIE));
  if (existente[0]) return existente[0].id;

  const [noua] = await baza
    .insert(materie)
    .values({ nume: NUME_MATERIE, sursa: "livrat" })
    .returning();
  return noua.id;
}

/** Rulează pachetul o singură dată, pe viață de bază de date. */
async function odata(nume: string, treaba: () => Promise<void>) {
  const { baza } = await deschideBaza();
  const scris = await baza
    .insert(samantaAplicata)
    .values({ nume })
    .onConflictDoNothing()
    .returning();
  if (scris.length === 0) return;

  try {
    await treaba();
  } catch (e) {
    // Dacă pachetul n-a intrat, nu-l însemnăm ca intrat.
    await baza.delete(samantaAplicata).where(eq(samantaAplicata.nume, nume));
    throw e;
  }
}

export async function aplicaSeminte(): Promise<number> {
  const { baza } = await deschideBaza();
  const materieId = await idMaterie();

  await odata("capitol-1", async () => {
    const capitoleVechi = await baza
      .select()
      .from(capitol)
      .where(eq(capitol.materieId, materieId));
    // Baze făcute înainte să existe pachetele: conținutul e deja acolo.
    if (capitoleVechi.length > 0) return;

    const [cap] = await baza
      .insert(capitol)
      .values({ materieId, nume: "Primele funcții", ordine: 1 })
      .returning();
    const [niv] = await baza
      .insert(nivel)
      .values({
        capitolId: cap.id,
        nume: "Funcții care întorc un număr",
        ordine: 1,
        stare: "deschis",
      })
      .returning();
    await baza
      .insert(exercitiu)
      .values(EXERCITII_NIVEL_1.map((e) => ({ ...e, nivelId: niv.id })));
  });

  await odata("capitol-1-briefinguri", async () => {
    const primul = await primulNivel(materieId);
    await baza
      .update(nivel)
      .set({ briefing: { ecrane: BRIEFING_NIVEL_1 } })
      .where(eq(nivel.id, primul));
  });

  await odata("capitol-1-nivel-2", async () => {
    const capitole = await baza
      .select()
      .from(capitol)
      .where(eq(capitol.materieId, materieId))
      .orderBy(asc(capitol.ordine));

    const [niv] = await baza
      .insert(nivel)
      .values({
        capitolId: capitole[0].id,
        nume: "Bucle peste o listă",
        ordine: 2,
        stare: "blocat",
        briefing: { ecrane: BRIEFING_NIVEL_2 },
      })
      .returning();
    await baza
      .insert(exercitiu)
      .values(EXERCITII_NIVEL_2.map((e) => ({ ...e, nivelId: niv.id })));
  });

  return materieId;
}

async function primulNivel(materieId: number): Promise<number> {
  const { baza } = await deschideBaza();
  const randuri = await baza
    .select({ id: nivel.id })
    .from(nivel)
    .innerJoin(capitol, eq(nivel.capitolId, capitol.id))
    .where(and(eq(capitol.materieId, materieId), eq(nivel.ordine, 1)))
    .orderBy(asc(nivel.id));
  return randuri[0].id;
}
