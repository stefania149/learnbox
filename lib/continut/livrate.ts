/**
 * Aducerea cursurilor livrate din `public/cursuri/` (pasul 11).
 *
 * Fișierele nu intră în bundle: se cer cu `fetch` la prima nevoie și se țin
 * apoi în memorie, pe durata filei. Service worker-ul le are în coajă, deci
 * după prima vizită vin din depozit, și fără internet.
 *
 * Lista e scrisă aici, nu într-un catalog descărcat: un catalog ar însemna
 * încă o cerere și încă un fișier de ținut sincronizat, pentru trei rânduri.
 * Se schimbă când se adaugă cursuri (pasul 13).
 */
import { citesteCurs, type CursLivrat } from "./format";

const baza = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Cheia fișierului: `public/cursuri/<cheie>.json`. */
export const CURSURI_LIVRATE = ["python"] as const;
export type CheieCurs = (typeof CURSURI_LIVRATE)[number];

/** Cursul cu care pornește aplicația cât timp nu există alegere de curs. */
export const CURS_IMPLICIT: CheieCurs = "python";

const aduse = new Map<string, Promise<CursLivrat>>();

async function adu(cheie: string): Promise<CursLivrat> {
  const adresa = `${baza}/cursuri/${cheie}.json`;
  const raspuns = await fetch(adresa);
  if (!raspuns.ok) {
    throw new Error(
      `Cursul „${cheie}" nu s-a putut aduce (${raspuns.status}). ` +
        "Dacă tocmai ai pierdut internetul, redeschide aplicația: " +
        "ce ai jucat până acum e în browser, neatins.",
    );
  }
  // Validarea e aici, la marginea aplicației: mai departe umblă un `CursLivrat`
  // despre care se știe că are tot ce trebuie.
  return citesteCurs(await raspuns.json());
}

export function cursLivrat(cheie: CheieCurs = CURS_IMPLICIT): Promise<CursLivrat> {
  const deja = aduse.get(cheie);
  if (deja) return deja;
  // Cererea se ține, nu rezultatul: două ecrane pornite deodată cer o dată.
  const promisiune = adu(cheie).catch((e: unknown) => {
    aduse.delete(cheie);
    throw e;
  });
  aduse.set(cheie, promisiune);
  return promisiune;
}
