// Firul pe care rulează SQL-ul scris de utilizator.
//
// **Nu e baza aplicației.** `baza.worker.js` ține progresul, în IndexedDB, și
// nu se atinge de aici: firul ăsta pornește un Postgres gol, în memorie, care
// moare odată cu fila. Nimic din ce scrie cineva într-un exercițiu nu poate
// ajunge peste încercările lui.
//
// Ca la Python (`PLAN.md` §7): fir separat, cronometru ținut pe firul
// principal, iar la depășire firul se omoară și repornește. O interogare
// recursivă fără capăt blochează firul ăsta, nu interfața.
//
// Fișier static, neatins de împachetător (vezi scripts/copiaza-vendor.mjs).
import { PGlite } from "./vendor/pglite/index.js";

/** Se umple la fiecare rulare: notice-urile Postgresului, ca ieșire de consolă. */
let iesire = [];

const baza = await PGlite.create({
  onNotice: (n) => iesire.push({ flux: "stderr", text: n.message }),
});

self.postMessage({ tip: "pornit" });

/** Între două cazuri nu rămâne nimic: aceeași bază, dar schema se face din nou. */
async function curataTot() {
  await baza.exec("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

/**
 * Rândurile, aduse la un text care se poate scrie de mână într-un fișier de
 * curs: o listă de liste, în ordinea coloanelor cerute.
 *
 * Numele coloanelor nu intră în comparație. Un alias greșit nu strică
 * exercițiul — XP-ul măsoară efortul, nu grija pentru formă.
 */
function scrieRandurile(rezultat) {
  const coloane = (rezultat?.fields ?? []).map((f) => f.name);
  const randuri = (rezultat?.rows ?? []).map((r) =>
    coloane.map((c) => {
      const v = r[c];
      if (typeof v === "bigint") return Number(v);
      if (v instanceof Date) return v.toISOString();
      return v;
    }),
  );
  return JSON.stringify(randuri);
}

/** Ultima instrucțiune din ce a scris utilizatorul e cea care dă răspunsul. */
function ultimul(rezultate) {
  return Array.isArray(rezultate) ? rezultate[rezultate.length - 1] : rezultate;
}

self.onmessage = async (ev) => {
  const { id, cod, cazuri } = ev.data;
  iesire = [];

  const erori = [];

  for (const [indice, caz] of cazuri.entries()) {
    let stare;
    let primit;
    try {
      await curataTot();
      if (caz.pregatire) await baza.exec(caz.pregatire);

      const aleUtilizatorului = await baza.exec(cod);
      const deComparat = caz.verificare
        ? await baza.query(caz.verificare)
        : ultimul(aleUtilizatorului);

      primit = scrieRandurile(deComparat);
      stare = primit === caz.asteptat ? "trecut" : "picat";
    } catch (e) {
      // Mesajul real al Postgresului, nu un rezumat al nostru.
      primit = (e?.message ?? String(e)).split("\n")[0].trim();
      stare = "eroare";
      erori.push(primit);
    }
    self.postMessage({ id, tip: "progres", caz: { indice, stare, primit } });
  }

  // Aceeași eroare la toate cazurile înseamnă un cod care nici n-a pornit — o
  // virgulă lipsă, un tabel scris greșit. Se anunță ca eroare de cod, ca să
  // ajungă în consolă întreagă, nu ca patru cazuri picate.
  const totErori = erori.length === cazuri.length && cazuri.length > 0;
  if (totErori && erori.every((m) => m === erori[0])) {
    self.postMessage({ id, tip: "eroare", iesire, eroare: erori[0] });
    return;
  }

  self.postMessage({ id, tip: "rezultat", iesire, valoare: null });
};
