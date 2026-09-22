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
  /** Ai citit briefingul unei lecții — mic, garantat, o singură dată. */
  briefing: 3,
  /** Te-ai întors după o pauză. Se dă tăcut, nu se anunță. */
  revenire: 5,
  /** Ai dus testul până la capăt, oricâte ai nimerit. */
  testDus: 10,
  /** Pentru fiecare întrebare la care ai răspuns bine. */
  intrebareBuna: 4,
  /** Ai terminat testul unei lecții — mare. */
  testNivel: 25,
  /** Ai terminat testul unui capitol — foarte mare. */
  testCapitol: 60,
} as const;

/** După câte ore de pauză se dă bonusul de revenire. */
export const PAUZA_ORE = 16;

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

/**
 * XP-ul unui test dus până la capăt.
 *
 * Aceeași regulă ca la exerciții: se plătește mersul până la capăt, nu nota.
 * Cine răspunde greșit la tot iese cu XP pozitiv și cu explicația fiecărei
 * întrebări. Testul se poate relua, și atunci se plătește din nou — o reluare
 * e tot efort (`PLAN.md` §8).
 */
export function socotesteXpTest({
  corecte,
  esteCapitol,
}: {
  corecte: number;
  esteCapitol: boolean;
}): SocotealaXp {
  const parti: Parte[] = [{ eticheta: "Ai dus testul până la capăt", xp: XP.testDus }];

  if (corecte > 0) {
    parti.push({
      eticheta:
        corecte === 1 ? "O întrebare bună" : `${corecte} întrebări bune`,
      xp: corecte * XP.intrebareBuna,
    });
  }

  parti.push({
    eticheta: esteCapitol ? "Test de capitol terminat" : "Test de lecție terminat",
    xp: esteCapitol ? XP.testCapitol : XP.testNivel,
  });

  return { parti, total: parti.reduce((s, p) => s + p.xp, 0) };
}
