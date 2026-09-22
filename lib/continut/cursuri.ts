/**
 * Lista cursurilor livrate — singurul loc în care e scrisă.
 *
 * Stă singură, fără niciun import, fiindcă o citesc și uneltele de la build
 * (`scripts/fa-rezumatul.mjs`), care rulează în Node pe fișiere TypeScript
 * fără împachetător. Un fișier care nu importă nimic se poate citi de oriunde.
 *
 * Se schimbă când se adaugă un curs. Un fișier pus în `public/cursuri/` și
 * neînscris aici nu există pentru aplicație.
 */

/** Cheia fișierului: `public/cursuri/<cheie>.json`. */
export const CURSURI_LIVRATE = ["python", "sql"] as const;
export type CheieCurs = (typeof CURSURI_LIVRATE)[number];

/** Cursul cu care se pornește când adresa nu spune altul. */
export const CURS_IMPLICIT: CheieCurs = "python";
