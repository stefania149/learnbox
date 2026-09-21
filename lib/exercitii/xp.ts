/**
 * XP-ul unei încercări, după tabelul din `PLAN.md` §8.
 *
 * XP-ul măsoară efortul expus, nu corectitudinea: orice rulare dă XP, fiecare
 * caz care trece dă încă o porție, iar rezultatul nu e niciodată negativ
 * (regula 4). Nu există scădere, pierdere sau penalizare — nicăieri.
 *
 * Numere întregi, niciodată `float`.
 */
export const XP = {
  /** Ai încercat exercițiul — garantat, indiferent de rezultat. */
  incercare: 5,
  /** Pentru fiecare caz de test care trece. */
  cazTrecut: 3,
  /** Toate cazurile trec. */
  toateCazurile: 15,
  /** Toate cazurile trec de la prima încercare. */
  dinPrima: 10,
} as const;

export type Parte = { eticheta: string; xp: number };

export type SocotealaXp = { parti: Parte[]; total: number };

export function socotesteXp({
  trecute,
  total,
  esteAdouaOara,
}: {
  trecute: number;
  total: number;
  /** Adevărat dacă exercițiul a mai fost încercat înainte. */
  esteAdouaOara: boolean;
}): SocotealaXp {
  const parti: Parte[] = [{ eticheta: "Ai încercat", xp: XP.incercare }];

  if (trecute > 0) {
    parti.push({
      eticheta:
        trecute === 1 ? "Un caz trece" : `${trecute} cazuri trec`,
      xp: trecute * XP.cazTrecut,
    });
  }

  if (total > 0 && trecute === total) {
    parti.push({ eticheta: "Toate cazurile trec", xp: XP.toateCazurile });
    if (!esteAdouaOara) {
      parti.push({ eticheta: "Din prima", xp: XP.dinPrima });
    }
  }

  return { parti, total: parti.reduce((s, p) => s + p.xp, 0) };
}
