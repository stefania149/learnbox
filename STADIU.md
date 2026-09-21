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
| 5 | Editorul de cod (CodeMirror) + consola de rezultat | Neinceput | |
| 6 | Navigarea joc: curs → capitol → lecție → briefing → practică | Neinceput | |
| 7 | XP, deblocare de lecții, ecranul de progres | Neinceput | |
| 8 | Un capitol de Python scris de mână, cap-coadă | Neinceput | |
| 9 | Export/import progres în fișier | Neinceput | |
| 10 | PWA: instalabil, cu iconiță, offline | Neinceput | |

## Faza 2 — Conținutul

| # | Pas | Status | Notițe |
|---|---|---|---|
| 11 | Formatul de curs livrat (JSON) + validare la încărcare | Neinceput | |
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

- **Ecranul „Starea browserului" e provizoriu.** Există ca să aibă pasul 1 o
  acțiune reală și ca să verifice din interfață ce cer pașii 2, 3 și 10. Se
  rescrie sau dispare când apare navigarea de joc (pasul 6).
- **PGlite nu trece prin împachetător.** `scripts/copiaza-vendor.mjs` îl copiază
  în `public/vendor/` la fiecare build, fiindcă Turbopack fie pierde legătura
  către `instantiateWasm`, fie (cu `transpilePackages`) bagă cod care cere
  `window` în worker. De reîncercat la o versiune viitoare de Next.
- **Exportul are ~48 MB**: ~17 MB PGlite, ~13 MB Pyodide, restul WASM
  necomprimat. Se servește comprimat, dar merită văzut dacă se pot scoate
  extensiile Postgres nefolosite din copie.
- **Ecranul „Rulare Python" e provizoriu.** Zonă de text simplă, ca pasul 3 să
  aibă o acțiune. Se înlocuiește cu editorul și consola la pasul 5.
- **Cele trei exerciții demo se seamănă o singură dată**, la prima deschidere
  (`lib/date/seminte.ts`). Dacă li se schimbă textul sau cazurile, baza locală
  păstrează versiunea veche — `incercare` trimite la ele și nu se rescrie.
  Capitolul adevărat vine la pasul 8, cu formatul de curs livrat.
- **Ecranul „Exerciții" e provizoriu.** Zonă de text și trei exerciții într-o
  listă, cât să aibă motorul o acțiune. Editorul vine la pasul 5, navigarea la 6.
- **O singură temă, dar prin tokenuri.** `app/globals.css` definește tokenurile;
  ecranele nu scriu culori. Sistemul de teme ca date vine la pasul 24.
