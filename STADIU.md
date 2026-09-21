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
| 1 | Next.js export static + GitHub Pages + publicare automată la push | In Lucru | Local e gata și verificat pe un export cu cale de bază. Rămâne crearea repo-ului pe GitHub, push pe `main` și pornirea Pages pe „GitHub Actions". |
| 2 | PGlite + Drizzle + schema + prima migrare, în IndexedDB | Neinceput | |
| 3 | Pyodide în Web Worker, cu cronometru și repornire | Neinceput | Înaintea oricărei interfețe — vezi `PLAN.md` §13 |
| 4 | Motorul de exerciții: cazuri de test, rulare, raport „3 din 5" | Neinceput | |
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
- **O singură temă, dar prin tokenuri.** `app/globals.css` definește tokenurile;
  ecranele nu scriu culori. Sistemul de teme ca date vine la pasul 24.
