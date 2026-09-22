# Stadiu

Se citește la începutul fiecărei sesiuni, se scrie la final.
Status: `Neinceput` · `In Lucru` · `Terminat`.

Un pas trece pe `Terminat` numai după ce trec toate cinci probele din
„Cum se termină un pas" (`CLAUDE.md`).

---

## Faza 1 — Jocul (fără AI)

Ținta: un capitol de Python scris de mână, jucabil cap-coadă, publicat pe
GitHub Pages. **Aici e linia de demo.**

| # | Pas | Status | Notițe |
|---|---|---|---|
| 1 | Next.js export static + GitHub Pages + publicare automată la push | Terminat | Live la `stefania149.github.io/learnbox/`. Repo-ul e `learnbox`; calea de bază se ia din numele lui, nu e scrisă nicăieri. |
| 2 | PGlite + Drizzle + schema + prima migrare, în IndexedDB | Terminat | Baza rulează într-un Web Worker, din fișiere statice — Turbopack rupe PGlite dacă îl împachetează. Tabelele pentru import și asistent vin în faza 3 (`PLAN.md` Î-12). |
| 3 | Pyodide în Web Worker, cu cronometru și repornire | Terminat | Fir separat, 5 secunde de răbdare, omorât și repornit la depășire. Servit din fișiere statice, ca PGlite. |
| 4 | Motorul de exerciții: cazuri de test, rulare, raport „3 din 5" | Terminat | Cazurile se anunță unul câte unul, deci ce a trecut înainte de cronometru rămâne câștigat. Determinismul din §7 stă într-un preludiu Python, nu în enunț. |
| 5 | Editorul de cod (CodeMirror) + consola de rezultat | Terminat | Colorarea sintaxei trece prin tokenuri de temă, ca restul. `Tab` mută focalizarea, nu indentează — altfel cine merge din tastatură rămâne prins în editor. |
| 6 | Navigarea joc: curs → capitol → lecție → briefing → practică | Terminat | Deblocarea lecțiilor a venit tot aici, altfel harta n-avea ce arăta; ecranul de progres și restul XP-ului rămân la pasul 7. O lecție se termină când ai **încercat** fiecare exercițiu (`PLAN.md` Î-14). |
| 7 | XP, deblocare de lecții, ecranul de progres | Terminat | Deblocarea venise la pasul 6. XP-ul care nu vine dintr-o încercare (briefing, revenire) trăiește doar în totaluri, nu are rând propriu — vezi `PLAN.md` Î-15. Testele de lecție și de capitol din tabelul §8 vin la pasul 14. |
| 8 | Un capitol de Python scris de mână, cap-coadă | Terminat | Capitolul „Funcții și bucle”: 5 lecții, 16 ecrane de briefing, 18 exerciții, în `lib/continut/`. `npm run continut:verifica` rulează Python adevărat peste tot capitolul: soluția trebuie să treacă toate cazurile, codul de pornire nu. |
| 9 | Export/import progres în fișier | Terminat | Ecranul `/copie/`, cu fișier JSON `tutore-progres-<data>.json`. Citirea e aditivă: nu șterge nimic, sare încercările pe care le ai deja (același exercițiu, aceeași clipă), iar XP-ul iese cel mai mare dintre cel de dinainte, cel din fișier și cel reconstituit din bază. Fișierul nu conține cursul, deci se leagă de exerciții după enunț. |
| 10 | PWA: instalabil, cu iconiță, offline | Terminat | Manifest, iconițe făcute din SVG la build, și un service worker scris de mână. Coaja (2,3 MB) intră în depozit la instalare; Pyodide și PGlite se rețin pe drum sau la cerere, de pe ecranul „Aplicația" (`PLAN.md` Î-18). O versiune nouă așteaptă să închizi filele, ca să nu amesteci bucăți de cod vechi cu noi. |

## Faza 2 — Conținutul

| # | Pas | Status | Notițe |
|---|---|---|---|
| 11 | Formatul de curs livrat (JSON) + validare la încărcare | Terminat | Cursul stă în `public/cursuri/python.json`, se aduce cu `fetch` și trece printr-un validator scris de mână (`lib/continut/format.ts`) înainte să atingă baza. Migrarea 0004 aduce `cheie` pe capitol, lecție și exercițiu, plus `ordine` pe exercițiu: un enunț rescris nu mai înseamnă exercițiu nou. Bazele de dinainte își primesc cheile la prima așezare, potrivite după nume. |
| 12 | Unealta de generare a cursurilor livrate, rulată la autor | Neinceput | |
| 13 | Două-trei cursuri livrate complete | Neinceput | |
| 14 | Testele de lecție și de capitol | Neinceput | |
| 15 | Arhiva deblocabilă | Neinceput | |

## Faza 3 — Agentul

| # | Pas | Status | Notițe |
|---|---|---|---|
| 16 | `lib/rutare-model.ts` + WebLLM + descărcare cu progres și refuz posibil | Neinceput | |
| 17 | Degradarea completă fără model, testată prin dezactivare | Neinceput | |
| 18 | Import PDF → chunk-uri → embeddings | Neinceput | |
| 19 | Graful de concepte + detectarea lacunelor + marcarea provenienței | Neinceput | |
| 20 | Generarea incrementală a cursului propriu | Neinceput | |
| 21 | Chatul cu asistentul + extragerea faptelor în memorie | Neinceput | |
| 22 | Ecranul de memorie, vizibil și editabil | Neinceput | |
| 23 | Personalizarea exercițiilor din memorie | Neinceput | |

## Faza 4 — Haina

| # | Pas | Status | Notițe |
|---|---|---|---|
| 24 | Sistemul de teme ca date + tokenuri | Neinceput | |
| 25 | Cele patru teme + tema implicită per curs | Neinceput | |
| 26 | Reacția mascotei la zero XP + cele trei registre de ton | Neinceput | |
| 27 | Răspunsuri libere cu rubrică, pentru materiile fără execuție | Neinceput | Partea care poate eșua — vezi `PLAN.md` §13 |

---

## Cusături

Limitări de prototip, de reparat înainte de a considera produsul gata.

- **PGlite se livrează de două ori.** Pe lângă copia din `public/vendor/`,
  Turbopack împachetează încă una în `_next/static/media/` — 16 MB degeaba,
  fiindcă worker-ul o folosește doar pe prima. Service worker-ul le tratează
  pe amândouă ca motoare, ca să nu se redescarce la fiecare versiune, dar
  cauza rămâne de găsit: probabil un import din `lib/date/client.ts` care
  trage pachetul și în bucata principală.
- **PGlite nu trece prin împachetător.** `scripts/copiaza-vendor.mjs` îl copiază
  în `public/vendor/` la fiecare build, fiindcă Turbopack fie pierde legătura
  către `instantiateWasm`, fie (cu `transpilePackages`) bagă cod care cere
  `window` în worker. De reîncercat la o versiune viitoare de Next.
- **Exportul are ~48 MB**: ~17 MB PGlite, ~13 MB Pyodide, restul WASM
  necomprimat. Se servește comprimat, dar merită văzut dacă se pot scoate
  extensiile Postgres nefolosite din copie. Pentru instalare nu mai cântărește
  la fel de mult: la instalare se ia doar coaja, 2,3 MB (`PLAN.md` Î-18).
- **Potrivirea după nume a rămas ca punte.** De la pasul 11 conținutul se
  leagă după `cheie`, dar `lib/date/seminte.ts` și `lib/date/copie.ts` știu
  încă să potrivească după nume și enunț: o bază făcută înainte de migrarea
  0004 are rânduri fără cheie, iar copiile de progres de versiunea 1 n-au
  chei deloc. Puntea se poate scoate când nu mai e plauzibil să existe astfel
  de baze — dar nu înainte, fiindcă scoaterea ei înseamnă progres pierdut.
- **`samanta_aplicata` nu mai e scrisă de nimeni.** Ținea pachetele de conținut
  aplicate o dată pe viață de bază. Cu chei stabile, așezarea cursului e
  idempotentă și se reia la fiecare încărcare de filă, deci tabelul e gol de
  sens. A rămas în schemă fiindcă o migrare care șterge un tabel nu se scrie
  ca să facă ordine.
- **Preîncărcarea rutelor, reparată la build.** Next 16 scrie bucata de
  preîncărcare într-un folder `__next.<ruta>/`, dar browserul o cere ca fișier
  `__next.<ruta>.__PAGE__.txt`. `scripts/repara-preincarcarea.mjs` o pune și în
  forma cerută; de scos când Next repară numele.
- **XP-ul din afara încercărilor nu are istoric.** Briefingul citit și bonusul
  de revenire se adună în `xp_total` și în `progres_nivel`, dar nu se scriu
  nicăieri rând cu rând. Ecranul de progres le arată ca sumă, nu ca listă. Dacă
  Arhiva (pasul 15) are nevoie de ele una câte una, trebuie un tabel de
  evenimente (`PLAN.md` Î-15).
- **Coperta are paleta ei.** Ecranul de intrare (`app/page.tsx`,
  `componente/terminal.tsx`) e desenat ca un monitor din anii '80 și
  folosește tokenurile `--tema-retro-*`, care nu se schimbă cu schema
  sistemului. Textul de pe el vine din capitolul livrat, nu din bază, ca să
  apară instantaneu. Vezi `PLAN.md` Î-16.
- **Ecranul de profil n-are pereche în `PLAN.md` §13.** `/profil/` e un dulap
  de vestiar cu afișul tău înăuntru (`componente/dulap.tsx`), cerut peste
  plan. Are paleta lui, `--tema-dulap-*`, și arată numai ce e în bază. Numele
  ales de utilizator stă în `setari.nume_afisat` (migrarea 0003) și nu pleacă
  nicăieri; partea de „să fiu găsit de alți jucători" nu se poate face fără
  server (`PLAN.md` §3). Vezi Î-17.
- **O linie de interfață e în engleză.** Sub traceback, în
  `componente/consola.tsx`, scrie „its not right but keep going" — cerută
  anume. E singura abatere de la „UI 100% română" din `CLAUDE.md`.
- **O singură temă, dar prin tokenuri.** `app/globals.css` definește tokenurile;
  ecranele nu scriu culori. Sistemul de teme ca date vine la pasul 24.
