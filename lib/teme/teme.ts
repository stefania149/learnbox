/**
 * Registrul temelor — pașii 24-25 (`PLAN.md` §10). O temă e date: un `id`
 * care devine `[data-tema]` pe `<html>` (`componente/tema.tsx`), plus
 * valorile ei în `app/globals.css`. Niciun ecran nu citește lista asta ca să
 * deseneze ceva diferit — doar ecranul de setări, ca să arate opțiunile.
 *
 * Cele patru de la v1 (`PLAN.md` §10).
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
  {
    id: "calda",
    nume: "Caldă",
    explicatie: "Chihlimbar și teracotă — potrivită materialului tău.",
  },
  {
    id: "minimalista",
    nume: "Minimalistă",
    explicatie: "Alb-negru, colțuri drepte, fără decor.",
  },
] as const;

export type Tema = (typeof TEME)[number]["id"];
export const TEMA_IMPLICITA: Tema = "sobra";

/**
 * `setari.tema_activa` poate fi „auto" — nu e o temă, ci un sentinel: „arată
 * tema implicită a cursului curent" (`materie.tema_implicita`), nu o alegere
 * fixă. Ecranul de setări o arată ca a patra opțiune, separat de listă.
 */
export const TEMA_AUTOMATA = "auto";

export function temaValida(id: string | null | undefined): Tema {
  return (TEME as readonly { id: string }[]).some((t) => t.id === id)
    ? (id as Tema)
    : TEMA_IMPLICITA;
}
