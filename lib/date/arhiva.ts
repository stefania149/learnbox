/**
 * Arhiva — pasul 15. Se deschide când toate testele materiei au fost duse
 * măcar o dată (`PLAN.md` §5, §8).
 *
 * Ce arată nu vine dintr-un model: e calculat mecanic din `incercare`, singurul
 * loc unde stau greșelile adevărate (principiul 1, regula 1). Fără ea Arhiva
 * n-ar putea exista — de-aia e un premiu adevărat, nu o insignă.
 *
 * Nimic de-aici nu judecă: „unde te-ai împiedicat" arată un număr de încercări,
 * nu un verdict. Regula 4 se aplică și pe ecranul ăsta.
 */
import { asc, eq, inArray } from "drizzle-orm";
import { deschideBaza } from "./client";
import { capitol, exercitiu, incercare, nivel } from "./schema";
import { aplicaSeminte, numeMateriei } from "./seminte";
import { CURS_IMPLICIT, type CheieCurs } from "@/lib/continut/livrate";
import { citesteXpTotal } from "./incercari";
import { progresTesteMaterie } from "./teste";

export type ExercitiuArhiva = {
  id: number;
  nivelId: number;
  nivelNume: string;
  capitolNume: string;
  enunt: string;
  incercari: number;
};

export type ConfuzieArhiva = ExercitiuArhiva & { mesaj: string; deCateOri: number };

export type Arhiva = {
  materieId: number;
  materie: string;
  xp: number;
  /** Exercițiile cu cele mai multe încercări — unde te-ai împiedicat. */
  imprejmuiri: ExercitiuArhiva[];
  /** Exerciții unde aceeași eroare a ieșit de cel puțin două ori. */
  confuzii: ConfuzieArhiva[];
  /** Exerciții trecute cu toate cazurile din prima încercare. */
  dinPrima: ExercitiuArhiva[];
  /** Câte un exercițiu pe capitol — cel mai încercat din el. Provocarea finală. */
  provocare: ExercitiuArhiva[];
};

export type StareArhiva =
  | { fel: "blocata"; duse: number; total: number }
  | { fel: "goala" }
  | { fel: "deschisa"; arhiva: Arhiva };

/** Sub cât nu se numără „te-ai împiedicat" — o singură încercare e mersul firesc. */
const PRAG_INCERCARI = 2;
const CATE = 5;

type RandIncercare = {
  exercitiuId: number | null;
  cazuriTrecute: number | null;
  cazuriTotal: number | null;
  eroarePython: string | null;
};

export async function stareaArhivei(
  cheieCurs: CheieCurs = CURS_IMPLICIT,
): Promise<StareArhiva> {
  const materieId = await aplicaSeminte(cheieCurs);
  const progres = await progresTesteMaterie(materieId);
  if (!progres.toateDuse) {
    return { fel: "blocata", duse: progres.duse, total: progres.total };
  }

  const { baza } = await deschideBaza();

  const capitole = await baza
    .select()
    .from(capitol)
    .where(eq(capitol.materieId, materieId))
    .orderBy(asc(capitol.ordine));
  if (capitole.length === 0) return { fel: "goala" };

  const niveluri = await baza
    .select()
    .from(nivel)
    .where(
      inArray(
        nivel.capitolId,
        capitole.map((c) => c.id),
      ),
    );

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
  if (exercitii.length === 0) return { fel: "goala" };

  const incercari: RandIncercare[] =
    await baza
      .select({
        exercitiuId: incercare.exercitiuId,
        cazuriTrecute: incercare.cazuriTrecute,
        cazuriTotal: incercare.cazuriTotal,
        eroarePython: incercare.eroarePython,
      })
      .from(incercare)
      .where(
        inArray(
          incercare.exercitiuId,
          exercitii.map((e) => e.id),
        ),
      )
      .orderBy(asc(incercare.creatLa), asc(incercare.id));

  const capitolNume = new Map(capitole.map((c) => [c.id, c.nume]));
  const nivelInfo = new Map(
    niveluri.map((n) => [n.id, { nume: n.nume, capitolId: n.capitolId }]),
  );

  const peExercitiu = new Map<number, RandIncercare[]>();
  for (const i of incercari) {
    if (i.exercitiuId === null) continue;
    const lista = peExercitiu.get(i.exercitiuId) ?? [];
    lista.push(i);
    peExercitiu.set(i.exercitiuId, lista);
  }

  function info(ex: (typeof exercitii)[number]): ExercitiuArhiva {
    const alNivelului = nivelInfo.get(ex.nivelId);
    return {
      id: ex.id,
      nivelId: ex.nivelId,
      nivelNume: alNivelului?.nume ?? "",
      capitolNume: alNivelului ? (capitolNume.get(alNivelului.capitolId) ?? "") : "",
      // Prima propoziție, ca la restul istoricului (`lib/date/progres.ts`).
      enunt: ex.enunt.split(".")[0],
      incercari: peExercitiu.get(ex.id)?.length ?? 0,
    };
  }

  const incercate = exercitii.filter((e) => (peExercitiu.get(e.id)?.length ?? 0) > 0);

  const imprejmuiri = incercate
    .filter((e) => (peExercitiu.get(e.id)?.length ?? 0) >= PRAG_INCERCARI)
    .map(info)
    .sort((a, b) => b.incercari - a.incercari || a.id - b.id)
    .slice(0, CATE);

  const confuzii: ConfuzieArhiva[] = incercate
    .flatMap((e) => {
      const rand = peExercitiu.get(e.id) ?? [];
      const dupaMesaj = new Map<string, number>();
      for (const i of rand) {
        if (!i.eroarePython) continue;
        dupaMesaj.set(i.eroarePython, (dupaMesaj.get(i.eroarePython) ?? 0) + 1);
      }
      let mesaj = "";
      let deCateOri = 0;
      for (const [m, n] of dupaMesaj) {
        if (n > deCateOri) {
          mesaj = m;
          deCateOri = n;
        }
      }
      if (deCateOri < PRAG_INCERCARI) return [];
      return [{ ...info(e), mesaj, deCateOri }];
    })
    .sort((a, b) => b.deCateOri - a.deCateOri || a.id - b.id)
    .slice(0, CATE);

  const dinPrima = incercate
    .filter((e) => {
      const prima = (peExercitiu.get(e.id) ?? [])[0];
      return (
        prima &&
        prima.cazuriTotal !== null &&
        prima.cazuriTotal > 0 &&
        prima.cazuriTrecute === prima.cazuriTotal
      );
    })
    .map(info)
    .slice(0, CATE + 1);

  // Câte un exercițiu pe capitol — cel mai încercat din el. Dacă un capitol
  // n-are niciun exercițiu încercat, nu contribuie cu nimic: provocarea nu
  // inventează ce n-ai atins.
  const provocare = capitole.flatMap((c) => {
    const aleCapitolului = incercate.filter(
      (e) => nivelInfo.get(e.nivelId)?.capitolId === c.id,
    );
    if (aleCapitolului.length === 0) return [];
    const cel = [...aleCapitolului].sort(
      (a, b) =>
        (peExercitiu.get(b.id)?.length ?? 0) - (peExercitiu.get(a.id)?.length ?? 0) ||
        a.id - b.id,
    )[0];
    return [info(cel)];
  });

  return {
    fel: "deschisa",
    arhiva: {
      materieId,
      materie: await numeMateriei(cheieCurs),
      xp: await citesteXpTotal(materieId),
      imprejmuiri,
      confuzii,
      dinPrima,
      provocare,
    },
  };
}
