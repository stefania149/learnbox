/*
 * Service worker-ul: ce face aplicația instalabilă și pornibilă fără rețea.
 *
 * Fișierul acesta e un șablon. La build, `scripts/fa-service-worker.mjs`
 * înlocuiește cele trei marcaje de mai jos cu valori adevărate, citite din
 * exportul gata făcut. În dezvoltare rămân goale și nu se înregistrează
 * nimic — altfel ai servi la nesfârșit bucăți vechi de cod.
 *
 * Două depozite, cu vieți diferite:
 *
 *   coaja    — paginile, CSS-ul, JS-ul. Vreo 2 MB. Se ia tot, la instalare,
 *              și se aruncă întreg la fiecare versiune nouă.
 *   motoarele — Pyodide și PGlite, 31 MB. Nu se descarcă la instalare: ar
 *              însemna să plătești 31 MB pentru un buton. Se rețin pe drum,
 *              pe măsură ce le ceri, și supraviețuiesc versiunilor — numele
 *              depozitului se schimbă doar când se schimbă ele.
 */

const VERSIUNE = "__VERSIUNE__";
const COAJA = `tutore-coaja-${VERSIUNE}`;
const MOTOARE = `tutore-motoare-__MOTOARE__`;
const BAZA = "__BAZA__";

/** Adresele coajei, scrise la build din ce a ieșit în `out/`. */
const PRECACHE = ["__PRECACHE__"];

self.addEventListener("install", (ev) => {
  // Fără `skipWaiting`: versiunea nouă așteaptă până închizi filele deschise.
  // Altfel o pagină pornită cu bucățile vechi ar cere, la primul click, bucăți
  // care tocmai au fost șterse.
  ev.waitUntil(
    (async () => {
      const cache = await caches.open(COAJA);
      // Una câte una, nu `addAll`: dacă o singură adresă lipsește, `addAll`
      // aruncă tot, iar instalarea eșuează în întregime.
      await Promise.all(
        PRECACHE.map((adresa) =>
          cache.add(new Request(adresa, { cache: "reload" })).catch(() => {}),
        ),
      );
    })(),
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    (async () => {
      const nume = await caches.keys();
      await Promise.all(
        nume
          .filter((n) => n.startsWith("tutore-") && n !== COAJA && n !== MOTOARE)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (ev) => {
  // Ecranul „Aplicația" poate cere versiunii noi să preia acum, când
  // utilizatorul apasă anume pentru asta.
  if (ev.data === "preia-acum") self.skipWaiting();
});

/**
 * Motoarele WASM: fișiere mari, aceleași la fiecare pornire. Pe lângă
 * `vendor/`, intră aici și ce împachetează Turbopack sub `_next/static/media/`
 * — tot PGlite, încă o dată. Amândouă au amprentă în nume, deci nu se pot
 * învechi sub aceeași adresă, și nu se aruncă la fiecare versiune nouă.
 */
function eMotor(cale) {
  return (
    cale.startsWith(`${BAZA}/vendor/`) ||
    cale.endsWith(".wasm") ||
    cale.endsWith(".data")
  );
}

/** Bucățile cu amprentă în nume nu se schimbă niciodată sub aceeași adresă. */
function eNeschimbator(cale) {
  return cale.startsWith(`${BAZA}/_next/static/`);
}

async function dinDepozitIntai(cerere, numeDepozit) {
  const cache = await caches.open(numeDepozit);
  const gasit = await cache.match(cerere);
  if (gasit) return gasit;
  const raspuns = await fetch(cerere);
  // Doar ce a ieșit bine. Un 404 pus în depozit ar rămâne 404 pentru totdeauna.
  if (raspuns.ok) await cache.put(cerere, raspuns.clone());
  return raspuns;
}

async function dinReteaIntai(cerere) {
  const cache = await caches.open(COAJA);
  try {
    const raspuns = await fetch(cerere);
    if (raspuns.ok) await cache.put(cerere, raspuns.clone());
    return raspuns;
  } catch (e) {
    const gasit = await cache.match(cerere);
    if (gasit) return gasit;
    // O navigare care n-are pagina ei în depozit primește coperta; e tot
    // aplicația, și de acolo se ajunge oriunde.
    if (cerere.mode === "navigate") {
      const acasa = await cache.match(`${BAZA}/`);
      if (acasa) return acasa;
    }
    throw e;
  }
}

self.addEventListener("fetch", (ev) => {
  const cerere = ev.request;
  if (cerere.method !== "GET") return;

  const adresa = new URL(cerere.url);
  if (adresa.origin !== self.location.origin) return;

  if (eMotor(adresa.pathname)) {
    ev.respondWith(dinDepozitIntai(cerere, MOTOARE));
    return;
  }
  if (eNeschimbator(adresa.pathname)) {
    ev.respondWith(dinDepozitIntai(cerere, COAJA));
    return;
  }
  ev.respondWith(dinReteaIntai(cerere));
});
