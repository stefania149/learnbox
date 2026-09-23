/**
 * Registrul temelor — pasul 24 (`PLAN.md` §10). O temă e date: un `id` care
 * se scrie în `setari.tema_activa` și devine `[data-tema]` pe `<html>`
 * (`componente/tema.tsx`), plus valorile ei în `app/globals.css`. Niciun
 * ecran nu citește lista asta ca să deseneze ceva diferit — doar ecranul de
 * setări, ca să arate opțiunile.
 *
 * La v1 (`PLAN.md` §10): patru teme. Aici sunt cele două făcute până acum;
 * „caldă" și „minimalistă" vin la pasul 25.
 */
export const TEME = [
  {
    id: "sobra",
    nume: "Sobră",
    explicatie: "Gri neutru, accent albastru calm. Implicită.",
  },
  {
    id: "terminal",
    nume: "Terminal",
    explicatie: "Monitor retro, sticlă verde — potrivită materiilor tehnice.",
  },
] as const;

export type Tema = (typeof TEME)[number]["id"];
export const TEMA_IMPLICITA: Tema = "sobra";

export function temaValida(id: string | null | undefined): Tema {
  return (TEME as readonly { id: string }[]).some((t) => t.id === id)
    ? (id as Tema)
    : TEMA_IMPLICITA;
}
