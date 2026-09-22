// Generat de `scripts/fa-rezumatul.mjs` din `public/cursuri/*.json`.
// Nu se scrie de mână: se schimbă un curs, se reface la build.

export const REZUMATE = [
  {
    cheie: "python",
    materie: "Python",
    limbaj: "python",
    capitol: "Funcții și bucle",
    lectii: 5,
    exercitii: 18,
  },
  {
    cheie: "sql",
    materie: "SQL",
    limbaj: "sql",
    capitol: "Întrebări puse unui tabel",
    lectii: 5,
    exercitii: 15,
  },
] as const;

/** Cursul cu care se deschide coperta. */
export const REZUMAT = REZUMATE[0];
