/**
 * Aducerea cursurilor livrate din `public/cursuri/` (pasul 11).
 *
 * Fișierele nu intră în bundle: se cer cu `fetch` la prima nevoie și se țin
 * apoi în memorie, pe durata filei. Service worker-ul le are în coajă, deci
 * după prima vizită vin din depozit, și fără internet.
 *
 * Lista cursurilor stă în `./cursuri`, nu într-un catalog descărcat: un
 * catalog ar însemna încă o cerere și încă un fișier de ținut sincronizat,
 * pentru trei rânduri.
 */
import { citesteCurs, type CursLivrat } from "./format";
import { CURSURI_LIVRATE, CURS_IMPLICIT, type CheieCurs } from "./cursuri";

const baza = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export {
  CURSURI_LIVRATE,
  CURS_IMPLICIT,
  type CheieCurs,
} from "./cursuri";

/**
 * Cursul ales stă în adresă (`/curs/?curs=sql`), nu în bază: o adresă spune
 * întreg unde ești, se poate pune la favorite, iar butonul „înapoi" face ce
 * trebuie. Ce vine din adresă e text de la cine vrea, deci se verifică.
 * Vezi `PLAN.md` Î-20.
 */
export function cheieCursului(v: string | null | undefined): CheieCurs {
  return (CURSURI_LIVRATE as readonly string[]).includes(v ?? "")
    ? (v as CheieCurs)
    : CURS_IMPLICIT;
}

/** Adresa unui ecran, cu cursul dus mai departe. */
export function cu(cale: string, cheie: CheieCurs, alte: Record<string, string | number> = {}) {
  const p = new URLSearchParams();
  if (cheie !== CURS_IMPLICIT) p.set("curs", cheie);
  for (const [k, v] of Object.entries(alte)) p.set(k, String(v));
  const coada = p.toString();
  return coada ? `${cale}?${coada}` : cale;
}

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
