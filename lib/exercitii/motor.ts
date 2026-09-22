/**
 * Motorul de exerciții: cod rulat pe cazuri de test, comparat mecanic.
 *
 * Verdictul nu trece prin niciun model (principiul 1). La Python se cheamă
 * expresia din caz, se ia `repr` al valorii și se compară text cu text — de
 * aceea `1` și `1.0` sunt două răspunsuri diferite, ca în exemplul din
 * `PLAN.md` §7. La SQL se așază datele cazului, se rulează ce a scris
 * utilizatorul și se compară rândurile ieșite.
 *
 * **Sunt două motoare, dar un singur raport.** Ce se vede pe ecran, cum se
 * numără cazurile trecute și cum se dă XP nu știu în ce limbă s-a scris.
 *
 * Cazurile se anunță unul câte unul, pe măsură ce trec: dacă al patrulea intră
 * într-o buclă fără sfârșit, primele trei rămân câștigate.
 */
import {
  python,
  RABDARE_MS,
  type LinieIesire,
  type ProgresCaz,
  type Rezultat,
} from "@/lib/python/client";
import { sql } from "@/lib/sql/client";
import { PRELUDIU, SAMANTA } from "./determinism";

/**
 * Un caz de test, în ambele limbi.
 *
 * La Python, `apel` e expresia care se evaluează și `asteptat` e `repr`-ul
 * valorii corecte. La SQL nu există un apel: `apel` e eticheta cazului, cea
 * care se vede în raport („trei angajați, unul fără șef"), `pregatire` face
 * tabelele, iar `asteptat` e lista de rânduri scrisă ca JSON.
 */
export type CazTest = {
  apel: string;
  asteptat: string;
  /** Doar la SQL: instrucțiunile care așază datele înaintea codului. */
  pregatire?: string;
  /** Doar la SQL: interogarea care verifică, când codul cerut e `INSERT`/`UPDATE`. */
  verificare?: string;
};

/** Pe ce motor se rulează exercițiul. Fără `limbaj` scris nicăieri, e Python. */
export type Limbaj = "python" | "sql";

export type StareCaz = "trecut" | "picat" | "eroare" | "prea-lung" | "nerulat";

export type RezultatCaz = CazTest & {
  stare: StareCaz;
  /** Ce a ieșit: `repr`-ul valorii, sau ultima linie a erorii. */
  primit: string | null;
};

export type Verdict =
  | "corect"
  | "partial"
  | "niciunul"
  | "cod-cazut"
  | "timp-expirat";

export type Raport = {
  verdict: Verdict;
  cazuri: RezultatCaz[];
  trecute: number;
  total: number;
  iesire: LinieIesire[];
  /**
   * Eroarea reală a motorului, când codul n-a apucat să ruleze deloc:
   * traceback-ul Python, sau plângerea Postgresului. Numele a rămas de la
   * vremea când exista un singur motor — și e și numele coloanei din bază.
   */
  eroarePython: string | null;
  /** Secundele de răbdare, când cronometrul a oprit rularea. */
  secunde: number | null;
};

function ham(cazuri: CazTest[]): string {
  const date = JSON.stringify(JSON.stringify(cazuri));
  return `
import json as _tut_json
import traceback as _tut_tb

_tut_cazuri = _tut_json.loads(${date})


def _tut_ruleaza():
    for _tut_i, _tut_caz in enumerate(_tut_cazuri):
        # Sămânță fixă înaintea fiecărui caz: cazurile nu se influențează.
        _tut_random.seed(${SAMANTA})
        try:
            _tut_val = eval(_tut_caz["apel"], globals())
            _tut_primit = repr(_tut_val)
            _tut_stare = "trecut" if _tut_primit == _tut_caz["asteptat"] else "picat"
        except Exception:
            _tut_primit = _tut_tb.format_exc().strip().splitlines()[-1]
            _tut_stare = "eroare"
        raporteaza_caz(_tut_i, _tut_stare, _tut_primit)


_tut_ruleaza()
`;
}

/** Cum se pornește o rulare, oricare ar fi motorul din spate. */
type Lansare = (laProgres: (caz: ProgresCaz) => void) => Promise<Rezultat>;

/**
 * Rulează codul utilizatorului pe cazurile date și întoarce raportul.
 * Nu scrie nimic în baza de date — asta e treaba apelantului.
 */
export async function evalueaza(
  limbaj: Limbaj,
  cod: string,
  cazuri: CazTest[],
  laProgres?: (cazuri: RezultatCaz[]) => void,
): Promise<Raport> {
  const lanseaza: Lansare =
    limbaj === "sql"
      ? (laProgresCaz) =>
          sql().ruleaza(
            cod,
            cazuri.map((c) => ({
              pregatire: c.pregatire,
              verificare: c.verificare,
              asteptat: c.asteptat,
            })),
            { laProgres: laProgresCaz },
          )
      : (laProgresCaz) =>
          python().ruleaza(`${PRELUDIU}\n${cod}\n${ham(cazuri)}`, {
            laProgres: laProgresCaz,
          });

  const stari = new Map<number, ProgresCaz>();
  const imbina = (final: (i: number) => StareCaz): RezultatCaz[] =>
    cazuri.map((caz, i) => {
      const anuntat = stari.get(i);
      return anuntat
        ? { ...caz, stare: anuntat.stare, primit: anuntat.primit }
        : { ...caz, stare: final(i), primit: null };
    });

  const rezultat = await lanseaza((caz) => {
    stari.set(caz.indice, caz);
    laProgres?.(imbina(() => "nerulat"));
  });

  // Când cronometrul a tăiat rularea, cazul următor celui din urmă anunțat e
  // cel care n-a vrut să se termine; cele de după el nici n-au început.
  const taiatLa = stari.size;
  const cazuriFinale =
    rezultat.fel === "timp-expirat"
      ? imbina((i) => (i === taiatLa ? "prea-lung" : "nerulat"))
      : imbina(() => "nerulat");

  const trecute = cazuriFinale.filter((c) => c.stare === "trecut").length;

  return {
    verdict: verdictul(rezultat.fel, trecute, cazuri.length),
    cazuri: cazuriFinale,
    trecute,
    total: cazuri.length,
    iesire: rezultat.iesire,
    eroarePython: rezultat.fel === "eroare" ? rezultat.eroare : null,
    secunde: rezultat.fel === "timp-expirat" ? rezultat.secunde : null,
  };
}

function verdictul(
  fel: "gata" | "eroare" | "timp-expirat",
  trecute: number,
  total: number,
): Verdict {
  if (trecute === total && total > 0) return "corect";
  if (fel === "timp-expirat") return "timp-expirat";
  // O eroare care a lăsat cazuri să treacă e o greșeală în cod, nu un cod căzut.
  if (fel === "eroare" && trecute === 0) return "cod-cazut";
  return trecute > 0 ? "partial" : "niciunul";
}

export { RABDARE_MS };
