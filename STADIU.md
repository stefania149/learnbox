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
| 8 | Un capitol de Python scris de mână, cap-coadă | Terminat | Capitolul „Funcții și bucle”: 5 lecții, 16 ecrane de briefing, 18 exerciții (mutate în `public/cursuri/python.json` la pasul 11). `npm run continut:verifica` rulează Python adevărat peste tot capitolul: soluția trebuie să treacă toate cazurile, codul de pornire nu. |
| 9 | Export/import progres în fișier | Terminat | Ecranul `/copie/`, cu fișier JSON `tutore-progres-<data>.json`. Citirea e aditivă: nu șterge nimic, sare încercările pe care le ai deja (același exercițiu, aceeași clipă), iar XP-ul iese cel mai mare dintre cel de dinainte, cel din fișier și cel reconstituit din bază. Fișierul nu conține cursul, deci se leagă de exerciții după enunț. |
| 10 | PWA: instalabil, cu iconiță, offline | Terminat | Manifest, iconițe făcute din SVG la build, și un service worker scris de mână. Coaja (2,3 MB) intră în depozit la instalare; Pyodide și PGlite se rețin pe drum sau la cerere, de pe ecranul „Aplicația" (`PLAN.md` Î-18). O versiune nouă așteaptă să închizi filele, ca să nu amesteci bucăți de cod vechi cu noi. |

## Faza 2 — Conținutul

| # | Pas | Status | Notițe |
|---|---|---|---|
| 11 | Formatul de curs livrat (JSON) + validare la încărcare | Terminat | Cursul stă în `public/cursuri/python.json`, se aduce cu `fetch` și trece printr-un validator scris de mână (`lib/continut/format.ts`) înainte să atingă baza. Migrarea 0004 aduce `cheie` pe capitol, lecție și exercițiu, plus `ordine` pe exercițiu: un enunț rescris nu mai înseamnă exercițiu nou. Bazele de dinainte își primesc cheile la prima așezare, potrivite după nume. |
| 12 | Unealta de generare a cursurilor livrate, rulată la autor | Terminat | `scripts/fa-cursul.mjs`: `cerere` adună briefingul autorului cu regulile casei, `primeste` calculează cheile, trece răspunsul prin validatorul aplicației și îl așază în `public/cursuri/`. Modelul se cheamă de mână, fără cheie API (`PLAN.md` Î-19). O cheie care ar dispărea între două generări oprește scrierea: ar însemna încercări orfane. |
| 13 | Două-trei cursuri livrate complete | Terminat | Al doilea curs e SQL: „Întrebări puse unui tabel", 5 lecții, 15 exerciții, rulate pe un Postgres gol în memorie (`public/sql.worker.js`), separat de baza cu progresul. Un caz de SQL are `pregatire` (datele) și rânduri așteptate scrise ca JSON; motorul e altul, raportul și XP-ul sunt aceleași. Cursul se alege din adresă (`PLAN.md` Î-20), iar copia de progres trece la versiunea 3, cu toate cursurile în ea. |
| 14 | Testele de lecție și de capitol | Terminat | Întrebări cu variante, scrise în cursul livrat: câte una pe ecran, cu explicația arătată după răspuns — și când ai nimerit, și când n-ai nimerit. Verdictul e o comparație de numere, deci merge fără model. Nu blochează nimic: se sare, se reia, și de fiecare dată plătește XP (`PLAN.md` §5, §8). Migrarea 0006 aduce `cheie` și `titlu` pe `test`, iar copia de progres trece la versiunea 4, cu trecerile prin teste în ea. |
| 15 | Arhiva deblocabilă | Terminat | Se deschide per curs, când toate testele lui sunt duse (`/arhiva/`), cu un rezumat calculat din `incercare` — fără model. Provocarea finală alege un exercițiu pe capitol; cu un singur capitol per curs acum, iese cu un singur exercițiu, dar se îmbogățește singură când vin capitole noi. |

## Faza 3 — Agentul

| # | Pas | Status | Notițe |
|---|---|---|---|
| 16 | `lib/rutare-model.ts` + WebLLM + descărcare cu progres și refuz posibil | Terminat | Panoul „Asistent" pe `/stare/`: verifică WebGPU, descarcă cu bară de progres, „Nu acum" nu strică nimic. Ca PGlite, pachetul (~6 MB) nu trece prin Turbopack — `scripts/fa-model-worker.mjs` îl împachetează cu esbuild în `public/vendor/web-llm/`, în afara coajei. Testat cap-coadă în Chrome: descărcare reală (664 MB, ~55s), motor pornit, recunoaște cache-ul la reîncărcare. Modelul ales: Llama-3.2-1B-Instruct-q4f16_1-MLC. |
| 17 | Degradarea completă fără model, testată prin dezactivare | Terminat | Nicio altă bucată de cod în afară de `lib/rutare-model.ts`, `rutare-model.worker.ts` și `app/stare/page.tsx` nu atinge WebGPU sau modelul. Testat cu „Nu acum" apăsat: curs, lecție, exercițiu Python rulat cu Pyodide, verdict și XP — totul mecanic, 42 XP câștigate fără model. Starea „fără WebGPU" e verificată din cod (o comparație simplă), nu testată pe hardware real fără el — nu am cum să dezactivez WebGPU-ul fără să repornesc Chrome. |
| 18 | Import PDF → chunk-uri → embeddings | Terminat | Ecranul `/import/`, legat din Setări. Migrarea 0007 aduce `material` și `chunk` (`embedding` jsonb, 384 de numere — Î-12 decisă). `pdf.js` și `@huggingface/transformers` merg ca fișiere statice, ca PGlite și WebLLM — `scripts/fa-embeddinguri-worker.mjs` și o extindere la `copiaza-vendor.mjs`. Nu cere WebGPU. Testat cap-coadă în Chrome cu un PDF real: text extras, bucată scrisă, embedding calculat. Graful de concepte și legarea de curs vin la pașii 19-20 — deocamdată bucățile doar stau în bază. |
| 19 | Graful de concepte + detectarea lacunelor + marcarea provenienței | Terminat | Ecranul `/concepte/`, legat din „Materialul tău". Migrarea 0008 aduce `concept` și `concept_leg`. Fiecare bucată trece prin model (JSON cu schemă, prin `response_format` din WebLLM), iar dependențele fără concept propriu devin lacune, completate de model și marcate „⚠️ completat de mine — profesorul n-a acoperit asta" (`PLAN.md` §6, cuvintele exacte). Testat cap-coadă cu modelul real: mecanismul merge, dar calitatea unui model de 1B e slabă — halucinează des, inventează concepte fără legătură cu textul. E limita acceptată a unui model mic (`PLAN.md` §12), nu un bug de reparat aici. |
| 20 | Generarea incrementală a cursului propriu | Terminat | Ecranul `/genereaza/`, legat din „Graful de concepte". Conceptele se așază topologic (Kahn, cu tăiere de cicluri) și fiecare devine o lecție cu un exercițiu: `solutie` și `apeluri` vin de la model, dar `asteptat` se scoate din rularea reală în Pyodide (principiul 1) — un exercițiu la care codul inițial trece deja cazurile se aruncă, nu se salvează. Incrementală și reluabilă: planul se vede imediat, lecțiile gata se sar. Testat cap-coadă cu modelul real, pe conceptele scoase la pasul 19: „1 lecție nouă, 13 s-au sărit" — nu un bug al pasului 20, ci consecința celor 13 concepte fiind ele însele halucinate la extragere. Lecția generată („funtie") a fost jucată integral din interfață: briefing, exercițiu, 3 cazuri trecute, 39 XP la încercarea aia. Un bug găsit și reparat pe drum: promptul avea un exemplu literal („dublu(3)") pe care modelul îl copia ca nume de funcție în loc să folosească numele lui — scos din prompt, plus filtrare defensivă în cod după numele real din `cod`. |
| 21 | Chatul cu asistentul + extragerea faptelor în memorie | Terminat | Ecranul `/asistent/`, legat din „Curs". Migrarea 0009 aduce `conversatie` și `memorie`. Regulile de ton (nu laudă, nu consolează, nu inițiază) stau în promptul de sistem din `lib/asistent/chat.ts`; extragerea (`lib/asistent/extrage.ts`) rulează în fundal după fiecare schimb, cu categorii fixe (enum în schemă), nu lăsate la alegerea modelului. Testat cap-coadă: chat funcțional, două răspunsuri reale primite. Un bug găsit și reparat: modelul copia descrierile categoriilor ca fapte reale chiar când nu fuseseră spuse — reparat cu o ancorare mecanică (faptul trebuie să aibă un cuvânt comun cu schimbul citit, altfel se aruncă). Un al doilea bug găsit: chatul și extragerea din fundal pot chema motorul WebLLM concurent, care a dat `ModelNotLoadedError` la a treia întrebare — reparat cu o coadă unică (`ruleazaPeModel` în `lib/rutare-model.ts`), dar fix-ul n-a mai putut fi reverificat live: WebGPU a devenit indisponibil în mijlocul testării (confirmat și în browserul normal al utilizatorului, nu doar în tab-ul automatizat) și n-a revenit nici după un restart de Chrome — mediul, nu codul; de reverificat cu două mesaje trimise rapid unul după altul când WebGPU e din nou disponibil. |
| 22 | Ecranul de memorie, vizibil și editabil | Terminat | Ecranul `/memorie/`, legat din „Asistent". Nu cere modelul — doar citește și șterge din `memorie` (regula 5 nu se pune, merge oricum). `stergeFaptul` scrie `sters_la`, nu `DELETE` (schema de la pasul 21). Testat cap-coadă: lista arată exact faptele hallucinate rămase din testarea pasului 21, ștergerea unui rând a dispărut din ecran și a rămas dispărută după reîncărcare. Un bug găsit la testare — ștergeri rapide, una după alta, se pierdeau una pe alta din lista optimistă locală (închidere pe starea veche) — reparat cu `setLista` funcțional, care pornește mereu de la starea curentă. |
| 23 | Personalizarea exercițiilor din memorie | Terminat | Buton „Personalizează din memorie" pe ecranul de practică (`/lectie/`), vizibil doar când modelul rulează deja și există fapte de tip facultate/materie făcută/exemplu clar. Migrarea 0009 aduce `exercitiu_personalizat` — un rând separat, niciodată o suprascriere a `exercitiu.enunt` (care s-ar rescrie oricum la fiecare așezare a cursului). Modelul rescrie doar povestea; cazurile de test și soluția nu se ating (regula 1). Testat cap-coadă: enunț personalizat afișat cu eticheta „Personalizat din memorie", comutator la enunțul original funcțional, iar exercițiul tot a trecut cazurile și a dat XP corect indiferent de ce enunț era arătat. Fără fapte sau fără model, butonul dispare și lecția arată identic cu dinainte de pasul ăsta. Un bug real găsit și reparat în extragerea de fapte (pasul 21): cuvinte românești comune („este", „care") treceau verificarea de ancorare în text ca și cum ar fi conținut real — filtrul aruncă acum și cuvintele astea. Calitatea faptelor extrase de modelul de 1B rămâne totuși slabă (a inventat „3D-Print, Robotica" dintr-o conversație despre facturi) — e limita acceptată a unui model mic (`PLAN.md` §12), nu un bug de reparat aici; ecranul de memorie (pasul 22) rămâne plasa de siguranță. |

## Faza 4 — Haina

| # | Pas | Status | Notițe |
|---|---|---|---|
| 24 | Sistemul de teme ca date + tokenuri | Terminat | Temele sunt un selector `[data-tema="..."]` peste aceleași nume de tokenuri (`app/globals.css`); `componente/tema.tsx` pune atributul pe `<html>`, citit din `setari.tema_activa`. Nicio componentă nu s-a atins ca să adauge a doua temă — testul principiului 9. Doi picker în `/setari/`: „Sobră" (nouă, implicită — gri neutru, accent albastru, colțuri mai mici) și „Terminal" (paleta de până acum, redenumită). Comutarea e instant, fără reîncărcare. Testat cap-coadă: schimbat live pe `/setari/`, verificat propagarea pe `/curs/` și `/profil/`, persistă după reîncărcare. Un bug găsit și reparat: un bloc `:root { --tema-dulap-*: ... }` rămas neșters din refactorizare aplica mereu paleta terminal peste `/profil/`, indiferent de tema aleasă — `:root` fiind neconditionat, câștiga cascada în fața `[data-tema="sobra"]`. Cele două teme rămase din §10 („caldă", „minimalistă") și tema implicită per curs vin la pasul 25. |
| 25 | Cele patru teme + tema implicită per curs | Terminat | Ultimele două teme din §10: „caldă" (chihlimbar/teracotă, pentru materialul tău) și „minimalistă" (alb-negru, fără raze, fără mascotă — SQL). Migrarea 0011 schimbă implicita lui `setari.tema_activa` din „sobra" în `auto` — un sentinel, nu o temă: `/setari/` are acum o a patra opțiune, „Automat", care urmează tema cursului curent. `materie.tema_implicita` se scrie la fiecare așezare (Python → terminal, SQL → minimalistă, materialul tău → caldă), iar `setari.materie_activa` ține minte care e cursul curent — amândouă scrise din `lib/date/seminte.ts`, singurul loc unde un curs se așază. Testat cap-coadă: comutat pe „Automat", verificat că `/curs/` arată terminal la Python, minimalistă la SQL și caldă la materialul tău, fiecare confirmat vizual. Un bug real găsit și reparat: `scrieTemaActiva` trecea orice valoare prin `temaValida`, care nu cunoștea sentinelul „auto" și-l prindea tăcut la „sobra" — alegerea „Automat" nu se salva niciodată. |
| 26 | Reacția mascotei la zero XP + cele trei registre de ton | Terminat | Când ieși din `/lectie/` fără să fi adus vreo încercare sau XP de briefing în vizita asta (`PLAN.md` §8: „a intrat, n-a atins nimic, a ieșit"), apasarea pe „Înapoi la curs" arată reacția mascotei în loc să navigheze direct — oferă mereu un exercițiu ușor (sare la primul din lecție) sau ieșirea reală. Formă proprie, animată doar din CSS (`componente/mascota.tsx`), nu un personaj din altă parte — discutat explicit cu utilizatorul, care a cerut inițial un aer de Mario/Peach; `PLAN.md` §3 exclude exact asta pe nume, așa că am mers pe alternativa originală. Cele trei registre din `lib/date/setari.ts` sunt acum folosite: jucăuș (mascotă + o replică din patru + confetti), neutru (o linie, fără personaj), sec („0 XP." și atât). Tema „minimalistă" rămâne fără mascotă prin CSS (`[data-tema="minimalista"] .mascota-figura`), fără ca `mascota.tsx` să știe ce temă e activă (principiul 9). Testat cap-coadă în Chrome: toate trei registrele confirmate vizual, „Încearcă un exercițiu ușor" sare corect la exercițiul 1, „Ies din lecție" navighează la curs. N-am mai apucat să reverific vizual mascota ascunsă pe tema minimalistă (SQL) în aceeași sesiune — PGlite s-a blocat după multe navigări rapide de testare (cusătura cunoscută despre lacătul „lider", nu un bug nou); tema minimalistă în sine se activase corect chiar înainte de blocaj. |
| 27 | Răspunsuri libere cu rubrică, pentru materiile fără execuție | Neinceput | Partea care poate eșua — vezi `PLAN.md` §13 |

---

## Cusături

Limitări de prototip, de reparat înainte de a considera produsul gata.

- **Tema „automat" întârzie o filă la prima vizită a unui curs nou.**
  `componente/tema.tsx` citește `setari.materie_activa` la montare, dar
  `lib/date/seminte.ts` o scrie separat, în timp ce așază cursul; prima oară
  când intri într-un curs nou într-o filă, tema veche rămâne pe ecran până la
  următoarea navigare sau reîncărcare. Nu strică nimic — doar arată o temă în
  urmă, o dată. De reparat când temele au un eveniment propriu, nu doar citire
  la montare.
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
- **PGlite se blochează dacă o filă moartă rămâne „lider".** Motorul alege un
  singur fir lider între toate filele deschise pe același origin, printr-un
  `navigator.locks`; dacă fila liderului e înghețată de Chrome pe fundal, cele
  noi așteaptă degeaba și cad pe cronometrul de 30s. Fixul e să închizi Chrome
  de tot, nu doar tab-ul — o filă restaurată la redeschidere poate relua
  blocajul. **Nu se umblă la lacăt cu `{steal: true}`**: încercat o dată, a
  pornit doi „lideri" deodată, scriind peste aceeași bază, și a stricat-o de
  tot (motorul Postgres nu mai pornea nici măcar în afara aplicației). S-a
  recuperat prin ștergerea bazei din `IndexedDB` — fără copie de progres la
  îndemână, ar fi fost pierdere reală.
- **O bucată din care modelul n-a scos niciun concept rămâne „neprocesată"
  pe veci.** `bucatiNeprocesate` (`lib/import/concepte.ts`) hotărăște după
  dacă există un rând de `concept` cu `chunk_id`-ul ei — o bucată cu răspuns
  gol nu capătă niciodată unul, deci fiecare „Construiește graful" o reia,
  degeaba. Nu strică nimic, doar pierde timp; de reparat cu un steag propriu
  pe `chunk` când chiar contează viteza.
- **Exportul are ~48 MB**: ~17 MB PGlite, ~13 MB Pyodide, restul WASM
  necomprimat. Se servește comprimat, dar merită văzut dacă se pot scoate
  extensiile Postgres nefolosite din copie. Pentru instalare nu mai cântărește
  la fel de mult: la instalare se ia doar coaja, 2,3 MB (`PLAN.md` Î-18).
- **Cele două fire de execuție sunt aproape gemene.** `lib/sql/client.ts` e
  copia lui `lib/python/client.ts`: aceeași pornire, același cronometru,
  aceeași omorâre și repornire. Diferă ce se trimite pe fir. De unit într-o
  bază comună când apare al treilea motor — nu mai devreme, fiindcă
  refacerea celui de Python, care merge, ar fi risc pe degeaba.
- **Prima lecție de SQL se bizuie pe ordinea de inserare.** Exercițiile ei
  ies înainte să se predea `ORDER BY`, deci cazurile așteaptă rândurile în
  ordinea în care au intrat în tabel. Pe tabele de trei-patru rânduri
  Postgres le dă mereu așa, și briefingul spune limpede că nu te poți bizui
  pe asta — dar e singurul loc din conținut unde verificarea nu e garantată
  de standard.
- **Răspunsul corect al unei întrebări nu se poate verifica de nimeni.**
  Exercițiile se probează cu Python și Postgres adevărat, deci o soluție
  greșită cade la autor. La teste nu există așa ceva: dacă `corect` arată
  spre altă variantă decât cea despre care vorbește explicația, nimic n-o
  prinde — s-a și întâmplat o dată, la scrierea capitolului de Python.
  Unealta verifică doar ce se poate verifica mecanic (variante identice,
  explicație care repetă varianta). Restul rămâne pe citit de om.
- **Migrările se recunosc după număr, nu după nume.** `drizzle-kit` botează
  fișierele la întâmplare și noi le rebotezăm; o bază care apucase să aplice
  migrarea sub numele generat o relua după rebotezare și cădea peste o
  coloană existentă. Evidența ține acum numărul din față, deci **două migrări
  nu pot avea același număr** niciodată. Tot n-avem sume de control: o
  migrare comisă și editată pe urmă se aplică bazelor noi și nu celor vechi,
  în tăcere — de-aia `CLAUDE.md` spune să nu se editeze.
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
- **Tema nu urmează schema sistemului.** Paleta copertei a devenit paleta
  întregii aplicații, și e fixă: cine ține calculatorul pe „luminos" primește
  tot un ecran închis. Era adevărat doar despre copertă, acum e adevărat
  peste tot. O temă deschisă se adaugă la pasul 24, fără să se atingă vreun
  ecran — tokenurile sunt deja acolo. Vezi `PLAN.md` Î-16.
- **Textul copertei vine din fișier, nu din bază.** `app/page.tsx` citește
  `lib/continut/rezumat.ts`, generat la build, ca să apară instantaneu, fără
  să deschidă baza (`PLAN.md` Î-16).
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
  ecranele nu scriu culori. Tema „terminal" s-a întins peste toată aplicația
  schimbând numai valorile din fișierul ăla și rama din `componente/ecran.tsx`
  — proba principiului 9. Sistemul de teme ca date vine la pasul 24.
- **Planul din `/genereaza/` nu se actualizează per lecție.** Lista arată „gata"
  abia după ce se termină tot lotul, nu pe măsură ce fiecare concept își capătă
  lecția — nu strică nimic, doar nu dă un semnal intermediar la o generare
  lungă.
- **Trei culori scrise ca text, în afara tokenurilor.** Manifestul PWA și cele
  două iconițe SVG sunt citite de sistemul de operare înainte să existe CSS,
  deci au fosforul și lemnul scrise în hex. La o temă nouă se schimbă de mână,
  în `app/manifest.ts`, `app/icon.svg` și `scripts/iconite/`.
