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
export type CheieCursLivrat = (typeof CURSURI_LIVRATE)[number];

/** Cursul cu care se pornește când adresa nu spune altul. */
export const CURS_IMPLICIT: CheieCursLivrat = "python";

/**
 * Cursul generat din materialul tău — pasul 20. Nu vine din `public/cursuri/`,
 * ci direct din bază (`materie.sursa = 'generat'`), deci nu intră în
 * `CURSURI_LIVRATE`: uneltele de la build (`fa-rezumatul.mjs`) ar căuta un
 * fișier care nu există.
 */
export const CURS_PROPRIU = "propriu" as const;

export type CheieCurs = CheieCursLivrat | typeof CURS_PROPRIU;
