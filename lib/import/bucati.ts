/**
 * Împarte textul unei pagini în bucăți — pasul 18. `PLAN.md` §15, Î-5:
 * ~800 de caractere, cu 100 suprapuse între bucăți vecine, ca o propoziție
 * tăiată la mijloc să apară întreagă măcar într-o bucată.
 */

export const MARIME_BUCATA = 800;
export const SUPRAPUNERE = 100;

export type PaginaText = { pagina: number; text: string };
export type BucataText = { pagina: number; text: string };

export function faBucati(pagini: PaginaText[]): BucataText[] {
  const bucati: BucataText[] = [];

  for (const p of pagini) {
    const text = p.text.trim().replace(/\s+/g, " ");
    if (text === "") continue;

    let start = 0;
    while (start < text.length) {
      const capat = Math.min(start + MARIME_BUCATA, text.length);
      bucati.push({ pagina: p.pagina, text: text.slice(start, capat) });
      if (capat === text.length) break;
      start = capat - SUPRAPUNERE;
    }
  }

  return bucati;
}
