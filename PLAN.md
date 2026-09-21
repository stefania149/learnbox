# Tutore — plan de construcție

Un joc care transformă materialele tale de curs într-o materie parcursă până la
capăt. Pentru cineva care vrea să recupereze ceva, dar n-are motivație s-o facă
singur.

Data: 21 septembrie 2026 · Stare: plan, nescris încă niciun rând de cod

---

## 0. Contextul proiectului

Proiect personal, public pe GitHub, folosit și ca piesă de portofoliu. Asta
fixează două constrângeri care bat orice altă considerație:

- **Zero costuri.** Nici pentru autor, nici pentru utilizator. Nici găzduire, nici API, nici abonament, nici cont.
- **Se încearcă dintr-un link.** Un recrutor se uită treizeci de secunde și nu descarcă nimic. Un demo funcțional care pornește la click valorează mai mult decât orice README.

Din ele rezultă toată arhitectura: **totul rulează în browserul utilizatorului,
nimic pe un server.** Nu există server. Nu e o economie, e o decizie.

A treia constrângere, nescrisă dar reală: **e un proiect de un singur om, în
timpul liber.** Un lucru mic și terminat valorează, în portofoliu, mult mai mult
decât unul mare și abandonat. Faza 1 e croită ca să fie demonstrabilă singură.

## 1. Ce e produsul

**Un joc per materie.** Îi dai cursurile de la facultate; programul le taie în
capitole și nivele, scrie lecții scurte cu exerciții practice, te testează la
final de nivel și de capitol, îți dă XP și deblochează lucruri. O mascotă
reacționează la ce faci, iar un asistent AI răspunde la întrebări despre materie
și potrivește exercițiile pe contextul tău.

Patru lucruri îl deosebesc de orice altă aplicație de învățat:

1. **Materia ta, nu una generică.** Cursul se construiește din PDF-urile pe care le încarci. Ce lipsește din ele și e strict necesar ca să înțelegi, agentul completează — **și scrie pe ecran că a completat el**.
2. **Totul se întâmplă înăuntru.** Înveți Python? Scrii Python în aplicație, pe un interpretor real care rulează în browser. Nu instalezi nimic, nu deschizi nimic altceva.
3. **Nu te face să te simți prost.** Niciodată. Constrângere de design, cu reguli concrete în §8.
4. **Gratuit, fără cont, fără instalare.** Deschizi un link și joci.

## 2. Cele zece principii

Regulile sub care se ia orice decizie. Când ceva nu e specificat, se alege
varianta care respectă cele mai multe.

| # | Principiu |
|---|---|
| 1 | **Un curs = un joc.** Nu un joc cu mai multe cursuri. Python are lumea lui, contabilitatea pe a ei — temă, vocabular, metafore proprii |
| 2 | **Fără server.** Tot calculul se face la utilizator. Nicio funcție nu presupune ceva care rulează în altă parte |
| 3 | **Materialul utilizatorului e sursa de adevăr.** Completările agentului se marchează vizibil, întotdeauna |
| 4 | **Teorie minimă, practică maximă.** Nicio lecție fără ceva de făcut. Teoria există ca să poți face exercițiul, nu invers |
| 5 | **Practica se face înăuntru.** Interpretor real în browser. Zero instalări, zero conturi, zero alt-tab |
| 6 | **Nu demoralizezi niciodată.** Zero XP declanșează o reacție de joc, nu tăcere. Fără penalizări, fără numere negative, fără serii pierdute |
| 7 | **Designul se schimbă, funcționalitatea nu.** Utilizatorul alege teme și grafică; nu poate strica nimic |
| 8 | **Asistentul e o unealtă, nu un prieten.** Ține minte contextul tău de studiu ca să potrivească exercițiile. Nu laudă, nu consolează, nu întreabă ce simți. Memoria e vizibilă și editabilă |
| 9 | **Pentru lacune, nu pentru zero.** Dar când chiar e zero la o materie, o ia de la zero fără să se plângă |
| 10 | **Merge și fără AI.** Orice funcție care cere modelul are o cale de rezervă. Un laptop fără WebGPU joacă tot jocul |

Principiile 8 și 10 sunt cele care țin produsul în picioare. Vezi §8 și §9.

## 3. Ce nu construim

Scos din model, nu amânat.

- **Server, backend, bază de date centrală, conturi, autentificare.** Contrazice principiul 2.
- **Sincronizare între dispozitive.** Progresul stă în browserul de pe laptopul tău. Se poate exporta într-un fișier, atât.
- **Multiplayer, clasamente, comparație cu alți utilizatori.** Contrazice principiul 6.
- **Serii zilnice cu pierdere** („ai pierdut seria de 12 zile"). Mecanică de vinovăție. Seriile se arată doar când cresc.
- **Aplicație mobilă nativă.** PWA-ul merge pe telefon; nu optimizăm pentru el la v1.
- **Magazin, monede, abonament, reclame.**
- **Import video/audio.** Doar text, PDF, imagini cu text.
- **Personaje sau muzică din francize existente.** Mascota e originală. Un Mario care dansează e drăguț în discuție și proces în realitate.
- **Editor de curs manual.** Cursul se generează și se poate corecta, dar nu construim un instrument de autorat.

## 4. Forma: aplicație web statică

**Next.js cu export static, găzduit pe GitHub Pages.** Fără server, fără rute API,
fără Server Actions — tot codul ajunge în browser. Publicare automată din repo
la fiecare push.

### Se instalează, totuși

**PWA.** Utilizatorul dă „Instalează", și primește o iconiță pe desktop, o
fereastră fără bară de browser, și pornire offline. Din ce părea că se pierde
trecând de la program la web, se recuperează aproape tot — dar se și poate încerca
dintr-un link.

### Unde stau datele

**PGlite, persistat în IndexedDB.** Postgres compilat în WASM, care rulează în
browser și își scrie datele local. Cu Drizzle deasupra și migrări numerotate,
exact ca la ERP — cunoștințele tale se transferă intact.

Alegerea merită justificată, fiindcă un Postgres întreg pentru progresul unui
joc pare exagerat: costă 3 MB lângă cei 10 ai lui Pyodide, îți păstrează
disciplina migrărilor, și face ca **SQL să fie a doua materie aproape gratis** —
motorul de exerciții e deja acolo.

**Datele din browser se pot pierde** (utilizatorul curăță istoricul, schimbă
browserul). De-aia **exportul progresului într-un fișier** nu e o funcție de lux,
e obligatorie, și intră devreme.

### Ce mărime are

Aplicația: câteva MB. Pyodide: ~10 MB. PGlite: ~3 MB. Modelul de embeddings:
~25 MB. Modelul de chat: 1–2 GB, descărcat **doar dacă utilizatorul vrea partea
de AI**, în cache-ul browserului, o singură dată.

## 5. Cursul ca joc

```
MATERIE (un joc întreg)     Python, SQL, Contabilitate…
  └─ CAPITOL (o lume)       „Bucle și repetiție"
       └─ NIVEL (o lecție)  „for peste o listă"
            ├─ Briefing     teorie minimă — 2-4 ecrane, nu mai mult
            ├─ Practică     3-6 exerciții, crescătoare
            └─ Test         autoevaluare, opțional, dă XP
       └─ TEST DE CAPITOL   mai lung, acoperă toate nivelele
  └─ ARHIVA                 deblocabilă, vezi §8
```

Python are o scară naturală de nivele — variabile, condiții, bucle, funcții,
liste, dicționare, fișiere — și de-aia e materia de probă. SQL se aplatizează
repede: după JOIN și GROUP BY nu mai ai mult de urcat.

**Nivelele se deblochează în ordine**, dar poți sări testul (nu și practica).
Testul sărit înseamnă XP nedat — și XP-ul e singurul lucru care deschide Arhiva.
I se spune din prima, clar, fără să pară pedeapsă: *„Testele îți deschid Arhiva
de la final. Poți sări peste, dar ea rămâne închisă."*

**Fiecare joc arată altfel.** Nu e aceeași aplicație cu alt logo — Python primește
o estetică de editor și consolă, o materie descriptivă primește altceva.
Tema implicită se alege în funcție de materie; utilizatorul o poate schimba
oricând (§10).

## 6. De unde vine conținutul

Două surse, care arată identic pe ecran și se joacă identic.

### Cursurile livrate — cazul principal

**Materiile comune sunt aceleași pentru toată lumea.** Python e Python. N-are rost ca
fiecare browser din lume să genereze același curs, prost și încet.

Un set de cursuri se generează **o singură dată, la autor, cu un model puternic**,
se verifică de om, și se comite în repo ca fișiere JSON. Costă o dată, în euro
numărabili. Utilizatorul le deschide **instant, la calitate maximă, fără niciun
model descărcat**.

Asta e ce vede oricine dă click pe link: un joc care merge imediat.

### Cursul tău — diferențiatorul

Importul propriu, în patru etape:

1. **Ingestie** — PDF (prin `pdf.js`) → text → chunk-uri cu embeddings (`transformers.js`, model de ~25 MB). Se păstrează documentul și pagina pentru fiecare bucată.
2. **Graful de concepte** — se extrag conceptele atomice și dependențele dintre ele. Un graf, nu o listă: „nu poți face JOIN înainte de SELECT".
3. **Detectarea lacunelor** — concepte referite dar neacoperite de material. Profesorul a sărit peste ele, dar fără ele nu se poate merge mai departe. Agentul le scrie singur, marcate `provenienta = 'model'`, afișate cu însemnul lor: ⚠️ *completat de mine — profesorul n-a acoperit asta*.
4. **Structurarea** — graful se aranjează topologic în capitole și nivele; se generează briefingul, exercițiile și testele.

**Generarea e incrementală și reluabilă.** Structura și titlurile apar în primul
minut — vezi harta jocului imediat. Nivelele se scriu pe rând, în fundal, în
ordine. Poți începe nivelul 1 în timp ce nivelul 7 se scrie, poți închide fila și
relua.

**Durează.** Un model mic în browser scrie încet; un curs întreg e treabă de ore,
nu de minute. Nu ascundem asta după o bară de progres — o spunem, și oferim
„importă acum, joacă mâine" ca mod de lucru legitim.

**Dacă chiar nu știe nimic** la materia aia, graful pornește de la rădăcină.
Pentru lacune punctuale, un test scurt de plasare marchează ce stăpânește deja:
nivelele alea rămân deschise, dar nebifate.

## 7. Practica se face înăuntru

**Pyodide** — CPython compilat în WASM. Python adevărat, cu stdlib și cu
mesajele de eroare reale, rulând în browser. Fără server, fără instalare.

### Corectarea, ca la teste unitare

Fiecare exercițiu vine cu un set de **cazuri de test**. Codul tău rulează pe
fiecare, iar rezultatul se compară cu cel așteptat. Verdictul nu depinde de
niciun model — **merge și pe un laptop care n-a descărcat nimic**.

Asta dă mecanica de joc pe care SQL n-o avea: **progresul e parțial și vizibil.**

```
▸ ✓ suma([1, 2, 3])        → 6      corect
▸ ✓ suma([])               → 0      corect
▸ ✓ suma([-1, 1])          → 0      corect
▸ ✗ suma([0.5, 0.5])       → 1      ai primit 1.0
▸ ✗ suma(range(1000))      → …      a durat prea mult

  3 din 5 cazuri trec. Ești aproape.
```

Nu mai consolezi pe cineva care a greșit — îi arăți cât a reușit. Cazurile care
trec se aprind pe rând, la fiecare rulare, și fiecare rulare dă XP (§8).

### Trei tipuri de exercițiu

| Tip | Ce face utilizatorul | Cum se verifică |
|---|---|---|
| **Completează** | Cod aproape gata, cu goluri | Cazuri de test pe întreg |
| **Repară bug-ul** | Primește cod stricat | Cazuri de test, după reparare |
| **Scrie funcția** | Pornește de la un antet dat | Cazuri de test pe valoarea returnată |

În ordinea asta, și în ordinea asta apar într-un nivel: „completează" cere cel mai
puțin, „scrie funcția" cel mai mult. Toate trei se verifică la fel — cod rulat pe
cazuri de test — deci motorul e unul singur.

### Bucla infinită

Un student scrie `while True:` în primele zece minute. La SQL asta nu se putea
întâmpla; la Python îngheață fila.

**Pyodide rulează într-un Web Worker**, niciodată pe firul principal. Fiecare
rulare are cronometru; la depășire, worker-ul se omoară și repornește. Interfața
nu se blochează niciodată.

Mesajul nu e o eroare, e o lecție:
*„Codul tău a rulat 5 secunde și nu s-a oprit. Probabil ai o buclă care nu se
termină — verifică dacă ceva chiar schimbă condiția."*

### Determinism

Exercițiile trebuie să dea același rezultat de fiecare dată, altfel verificarea
n-are sens. `input()` e interzis în enunțuri, `random` se rulează cu sămânță
fixă, iar data și ora se înlocuiesc cu valori fixate. Rețea și fișiere nu există
oricum în Pyodide, ceea ce ne convine.

### Pentru materiile fără execuție

Corectarea se face cu rubrică. E partea fragilă a produsului, și e ultima (§13).

## 8. XP, deblocări, și regula anti-demoralizare

**XP-ul măsoară efortul expus, nu corectitudinea.** E cea mai importantă decizie
din document, pentru că face principiul 6 realizabil în loc de bine intenționat.

| Acțiune | XP |
|---|---|
| Ai citit un briefing | mic, garantat |
| Ai încercat un exercițiu | garantat, **indiferent de rezultat** |
| **Fiecare caz de test care trece** | **proporțional — 3 din 5 dau 3 porții** |
| Exercițiu corect (toate cazurile) | principalul |
| Corect din prima | bonus |
| Test de nivel terminat | mare |
| Test de capitol terminat | foarte mare |
| Te-ai întors după o pauză | bonus de revenire, tăcut |

**Nu există XP negativ, pierdere sau penalizare.** Cine a deschis lecția și a
încercat tot, greșind tot, termină cu XP pozitiv și cu o explicație pentru
fiecare greșeală.

**Când totuși iese zero** (a intrat, n-a atins nimic, a ieșit), **mascota** face
ceva mic și caraghios, și oferă un exercițiu ușor. O animație și o replică fixă,
din trei-patru scrise dinainte.

**Mascota nu e asistentul AI.** E un element de joc: animație, sunet, replică din
listă. Nu se generează cu model, nu vorbește despre tine, nu ține minte nimic, nu
poartă conversații. Face o figură și dispare.

Distincția e deliberată. Un feedback de joc care sare și face tumbe e amuzant.
Ceva care pare că te înțelege și te încurajează personal creează o relație pe care
n-o vrem — și, în plus, sună fals venind de la un model de 1B. **Nu construim
atașament, construim un joc.**

**Tonul se alege**, pentru că nu tuturor le place același. Trei registre, setate
la prima pornire, schimbabile oricând:

- **Jucăuș** — mascotă animată, exclamații, confetti
- **Neutru** — o linie de text, fără personaj
- **Sec** — „0 XP." și atât

Cineva căruia i se pare copilăresc și-a ales deja altceva.

**Arhiva.** Când termini toate testele unei materii, se deschide un rezumat
personal generat din *greșelile tale reale* — unde te-ai împiedicat, ce confuzie
ai repetat, ce ai prins din prima — plus o provocare finală care combină tot. E
singurul lucru din aplicație care nu poate exista fără istoricul tău, deci e un
premiu adevărat, nu o insignă.

## 9. Asistentul AI, și ce se întâmplă fără el

**O unealtă, nu un personaj.** Se deschide când ai nevoie de el, tace când n-ai.

### Ce face

- **Răspunde la întrebări despre materie.** „De ce dă eroare aici?", „ce înseamnă `enumerate`?", „mai dă-mi un exemplu". Asta e treaba lui principală.
- **Explică o greșeală după verdict.** Verdictul e deja dat de cazurile de test; el spune doar de ce.
- **Potrivește exercițiile pe contextul tău.** Dacă ești la Economie, exemplele lucrează cu facturi și prețuri, nu cu animale.

### Ce nu face

- **Nu laudă și nu consolează.** „Bravo, ai reușit!" nu există. Reacția la reușită e a jocului — XP, nivel deblocat, mascota. Nu a unui model care se preface că se bucură.
- **Nu întreabă ce simți** și nu comentează starea ta.
- **Nu inițiază conversații.** Nu apare după o greșeală să te întrebe cum merge. Se deschide când îl deschizi tu.
- **Nu are personalitate de întreținut** — nu-ți e dor de el, nu te așteaptă, nu-ți zice „ne vedem mâine".

Motivul e simplu: ceva care pare că te înțelege produce atașament, iar atașamentul
de un model de 1B e o promisiune pe care produsul n-o poate ține. **Jocul te ține
cu XP, nivele și Arhivă. Asistentul te ajută cu materia.** Nu amestecăm.

### Memoria — despre studiu, nu despre tine

Asistentul întreabă lucruri și reține răspunsurile, dar **numai ce schimbă
conținutul**:

| Se reține | Nu se reține |
|---|---|
| Ce facultate, ce domeniu | Cum te simți |
| Ce examen ai și când | Ce te motivează |
| Ce materii ai făcut deja | Ce te frustrează |
| Cât de lungi îți plac sesiunile | Ce ți-ai spus în treacăt despre tine |
| Ce fel de exemple ți-au fost clare | Orice ar servi doar la „a te cunoaște" |

Întrebările sunt fire de conversație normală („la ce facultate ești?", „ai mai
scris cod înainte?"), nu un formular. Dar toate duc undeva concret: la ce exemple
apar în exerciții și cât de repede urcă dificultatea.

**Memoria e vizibilă și editabilă.** Un ecran cu tot ce știe, text simplu, cu
buton de șters pe fiecare rând. Ce nu poți vedea nu poți corecta.

### Modelul, în browser

**WebLLM**, prin WebGPU. Un model de 1–3B, descărcat o dată în cache-ul
browserului. Merge pe Chrome și Edge pe desktop; nu merge peste tot.

### Degradarea — principiul 10

**Aici se decide dacă produsul e solid sau fragil.** Dacă nu există WebGPU, dacă
utilizatorul refuză descărcarea, sau dacă are un laptop slab, jocul **nu se
strică**. Se restrânge:

| Funcție | Fără model |
|---|---|
| Cursurile livrate | **Merg integral.** Sunt JSON |
| Exerciții Python și verdict | **Merg integral.** Corectarea e mecanică |
| XP, nivele, deblocări, Arhiva | **Merg integral** |
| Explicația unei greșeli | Explicația scrisă dinainte, din curs |
| Teme, personalizare | **Merg integral** |
| Mascota, animațiile, replicile ei | **Merg integral.** Sunt scrise dinainte |
| Chat cu asistentul | Indisponibil, spus o dată, fără insistență |
| Import de materiale proprii | Indisponibil, cu explicația de ce |

Un utilizator fără AI joacă **tot jocul** pe cursurile livrate. Asta înseamnă și
că demo-ul de pe GitHub Pages funcționează pentru oricine dă click, fără să
descarce nimic — ceea ce era, de la început, scopul.

## 10. Teme și design

**Utilizatorul schimbă aspectul, niciodată funcționalitatea.** Granița se ține cu
arhitectura, nu cu bunăvoința: temele sunt **date**, nu cod.

O temă e un fișier cu: paletă, tipografie, forme, mascotă, sunete, animații de
recompensă. Interfața citește doar tokenuri — niciun ecran nu știe ce temă e
activă.

- **Fiecare materie primește o temă implicită**, potrivită ei.
- **Utilizatorul poate alege altă temă** oricând; se schimbă tot programul instantaneu.
- **Se pot adăuga teme noi** fără să atingi un singur ecran. Ăsta e testul că separarea e corectă.

La v1: patru teme. Una sobră implicită, una „terminal" pentru materii tehnice,
una caldă cu mascotă expresivă, una minimalistă fără personaj.

## 11. Schema de date

Nume în română fără diacritice. UI cu diacritice.

```
-- MATERIAL (doar la import propriu)
material        id, titlu, fisier, tip, importat_la
chunk           id, material_id, text, pagina, embedding

-- CURSUL
materie         id, nume, sursa, tema_implicita, stare_generare
                sursa: 'livrat' | 'generat'
concept         id, materie_id, nume, descriere, provenienta, chunk_id?
                provenienta: 'material' | 'model'
concept_leg     concept_id, depinde_de_id
capitol         id, materie_id, nume, ordine
nivel           id, capitol_id, nume, ordine, briefing (json), stare
exercitiu       id, nivel_id, tip, enunt, cod_initial, solutie,
                cazuri_test (json), rubrica (json)?, explicatie_predefinita
                tip: 'completeaza' | 'repara' | 'scrie' | 'liber'
test            id, nivel_id? | capitol_id?, intrebari (json)

-- PROGRESUL
stapanire       concept_id, stabilitate, dificultate, urmatoarea_verificare
progres_nivel   nivel_id, stare, xp_obtinut, terminat_la
incercare       id, exercitiu_id?, test_id?, raspuns, verdict,
                cazuri_trecute, cazuri_total, eroare_python,
                explicatie_eroare, xp, creat_la        -- IMUTABIL
xp_total        materie_id, xp, nivel_jucator

-- UTILIZATORUL
memorie         id, tip, continut, creat_la, sters_la
conversatie     id, rol, text, creat_la
setari          tema_activa, registru_ton, materie_activa, model_descarcat
```

**`incercare` nu se editează și nu se șterge niciodată.** Istoricul greșelilor e
ce face Arhiva posibilă și ce permite asistentului să observe că repeți aceeași
confuzie. O reluare corectă se scrie ca rând nou.

**`memorie` are `sters_la`, nu `DELETE`.** Când utilizatorul șterge un fapt,
dispare din context și de pe ecran — dar rândul rămâne, ca să nu fie reextras
imediat din aceeași conversație.

**`explicatie_predefinita` pe exercițiu** e ce face principiul 10 posibil: fiecare
exercițiu livrat vine cu explicația greșelilor tipice, scrisă la generare. Fără
model, tot primești un răspuns util.

## 12. Rutarea modelelor

**Un singur fișier decide: `lib/rutare-model.ts`.** Nicio altă bucată de cod nu
știe dacă există un model sau nu. Se schimbă într-un loc, se testează într-un loc.

| Sarcină | Unde |
|---|---|
| Cursurile livrate | **Pregenerate.** Model puternic, la autor, o dată |
| Embeddings la import | Browser, `transformers.js`, ~25 MB |
| Extras concepte și dependențe | Browser, WebLLM |
| Briefinguri, exerciții, teste (import propriu) | Browser, WebLLM |
| **Verdict la exercițiu** | **Niciun model.** Se rulează cazurile de test |
| Explicat o greșeală | Browser, WebLLM — **cu rezervă scrisă dinainte** |
| Evaluat răspuns liber | Browser, prompt izolat — **punctul slab**, vezi Faza 4 |
| Chat cu asistentul | Browser, WebLLM |
| Extras fapte din conversație | Browser, în fundal |
| Replicile mascotei | **Niciun model.** Listă fixă, scrisă de mână |

**De ce merge, deși modelele din browser sunt mici:** cele două lucruri de care
depinde corectitudinea nu trec prin model. Verdictul la exerciții e mecanic. Conținutul
cursurilor livrate e pregenerat cu un model bun. Modelului mic îi rămân sarcini
unde „acceptabil" e suficient.

**Exercițiul și rubrica se generează și se salvează împreună, înainte ca
utilizatorul să vadă enunțul.** Evaluarea unui răspuns liber rulează cu prompt
separat, care vede doar rubrica și răspunsul — **nu vede conversația**. Altfel
modelul îți dă dreptate pentru că ai scris convingător.

## 13. Fazele de execuție

Fiecare fază produce ceva demonstrabil singur.

### Faza 1 — Jocul (fără AI)
Un capitol de Python scris de mână, jucabil cap-coadă, publicat.

1. Next.js export static + GitHub Pages + publicare automată la push
2. PGlite + Drizzle + schema + prima migrare, persistate în IndexedDB
3. **Pyodide într-un Web Worker**, cu cronometru și repornire — înainte de orice interfață
4. Motorul de exerciții: cazuri de test, rulare, raport „3 din 5", verdict mecanic
5. Editorul de cod (CodeMirror) + consola de rezultat
6. Navigarea joc: materie → capitol → nivel → briefing → practică
7. XP, deblocare de nivele, ecranul de progres
8. Un capitol de Python scris de mână, cap-coadă
9. Export/import progres în fișier
10. PWA: instalabil, cu iconiță, offline

**Pasul 3 e primul din motiv.** Izolarea în worker nu e o optimizare de adăugat
mai târziu — dacă interfața se construiește peste Pyodide pe firul principal, se
rescrie tot când apare prima buclă infinită.

**Aici e linia de demo.** La finalul fazei 1 ai un link pe care oricine dă click
și joacă. Dacă nu e distractiv aici, AI-ul n-o să repare — și dacă proiectul se
oprește din lipsă de timp, tot ai ceva întreg de arătat.

### Faza 2 — Conținutul
11. Formatul de curs livrat (JSON) + validare la încărcare
12. Unealta de generare a cursurilor livrate, rulată la autor
13. Două-trei cursuri livrate complete
14. Testele de nivel și de capitol
15. Arhiva deblocabilă

**La finalul fazei 2 e un produs adevărat**, cu mai multe materii, care nu cere
niciun model de la nimeni.

### Faza 3 — Agentul
16. `lib/rutare-model.ts` + WebLLM + descărcarea modelului cu progres și cu refuz posibil
17. Degradarea completă fără model (§9), testată prin dezactivare
18. Import PDF → chunk-uri → embeddings
19. Graful de concepte + detectarea lacunelor + marcarea provenienței
20. Generarea incrementală a cursului propriu
21. Chatul cu asistentul + extragerea faptelor în memorie
22. Ecranul de memorie, vizibil și editabil
23. Personalizarea exercițiilor din memorie

### Faza 4 — Haina
24. Sistemul de teme ca date + tokenuri
25. Cele patru teme + tema implicită per materie
26. Consolarea la zero XP + cele trei registre de ton
27. Răspunsuri libere cu rubrică, pentru materiile fără execuție

**Pasul 27 e ultimul pentru că e cel care poate eșua.** Evaluarea unui răspuns
liber cu un model de 1–3B e partea cea mai fragilă din tot produsul. Dacă
rubricile se dovedesc prea permisive, afli asta având deja un produs întreg — iar
materiile cu execuție mecanică rămân neatinse.

## 14. Cum se termină un pas

Nu e terminat până nu trec toate cinci:

1. Se face **din interfață**, nu din consolă.
2. **Datele ajung unde trebuie** și se văd pe ecran.
3. **Principiul 6 e respectat** — nicăieri pe ecranul ăla nu scrie ceva care să demoralizeze.
4. **Merge fără model** (principiul 10), sau degradarea e explicită și testată.
5. **Îl folosești o sesiune reală.** Ce te enervează se repară acum, nu „mai târziu".

## 15. Întrebări deschise

- **Î-1.** ~~Ce materie la v1?~~ **Decis: Python**, prin Pyodide. Scară de nivele mai lungă decât SQL, și cazurile de test dau progres parțial vizibil (§7). SQL rămâne materia a doua — motorul PGlite e deja în aplicație.
- **Î-2.** Testul de plasare de după import — obligatoriu sau oferit? *Provizoriu: oferit, se poate sări.*
- **Î-3.** Cine e mascota și cum arată, în patru variante de temă? *Provizoriu: o formă abstractă simplă, animabilă din CSS — nu un personaj desenat.*
- **Î-4.** ~~Cheia API — a cui?~~ **Decis: nicio cheie.** Cursurile livrate sunt pregenerate; restul rulează în browser.
- **Î-5.** Cât de mari sunt chunk-urile la import? *Provizoriu: ~800 caractere, suprapunere 100.*
- **Î-6.** Câte cursuri livrate la v1, și care? *Nedecis. Cel puțin Python, fiindcă e materia de probă.*
- **Î-7.** Ce se întâmplă cu un cod corect ca rezultat dar prost scris? *Provizoriu: „corect", cu observație. Nu penalizează (principiul 6).*
- **Î-8.** Se avertizează utilizatorul că datele stau în browser și se pot pierde? *Provizoriu: da, o dată, la primul progres salvat, cu buton de export lângă.*
- **Î-9.** Ce se întâmplă pe telefon? *Provizoriu: PWA-ul merge, dar fără import și fără model. Nu optimizăm la v1.*
- **Î-10.** Cât e cronometrul pe o rulare de cod? *Provizoriu: 5 secunde. Destul pentru orice exercițiu de curs, scurt cât să nu pară blocaj.*
- **Î-11.** Se arată cazurile de test înainte de rulare, sau doar după? *Provizoriu: primele două se văd în enunț (ca exemple), restul apar la rulare. Altfel se scrie cod care trece testele fără să rezolve problema.*
- **Î-12.** Ce dimensiune are vectorul de embedding, și ce model îl produce? Până se decide, tabelele `material`, `chunk`, `concept`, `concept_leg`, `memorie` și `conversatie` nu există în schemă — vin cu migrarea lor în faza 3. *Provizoriu: nedecis.*
- **Î-13.** Cum se socotește `nivel_jucator` din XP-ul unei materii? Până se decide, rămâne `1` și nu apare pe ecran; XP-ul se adună, atât. *Provizoriu: nedecis.*
- **Î-14.** Când se consideră terminată o lecție, ca să se deblocheze următoarea? *Provizoriu: când fiecare exercițiu al ei a fost încercat măcar o dată — nu când toate trec. XP-ul măsoară efortul (§8), deci nici deblocarea nu se leagă de corectitudine.*
- **Î-15.** Unde stau evenimentele de XP care nu sunt încercări — briefingul citit, bonusul de revenire, mai târziu testele? §11 n-are loc pentru ele, fiindcă `incercare` cere un exercițiu sau un test. *Provizoriu: doar în totaluri (`xp_total`, `progres_nivel.xp_obtinut`), cu două steaguri în schemă (`progres_nivel.briefing_citit`, `setari.vazut_ultima_data`). Un tabel `eveniment_xp` se adaugă dacă Arhiva are nevoie de istoric.*
- **Î-16.** Coperta (ecranul de intrare) e desenată ca un calculator vechi și
  are paleta ei, fixă: nu urmează nici schema luminoasă sau întunecată a
  sistemului, nici tema aleasă de utilizator. Rămâne așa, sau se schimbă
  odată cu tema? *Provizoriu: rămâne fixă, fiindcă e un obiect desenat, nu un
  ecran de lucru. Tokenurile `--tema-retro-*` din `app/globals.css` devin
  paleta temei „terminal” (§10) la pasul 24.*
- **Î-17.** Cât de departe merge profilul? Ecranul `/profil/` arată ce e în
  bază — cursul, XP-ul, lecțiile, ce urmează — plus un nume ales de
  utilizator (`setari.nume_afisat`, migrarea 0003), scris de acolo și păstrat
  local. Partea socială (să fii găsit de alți jucători) cere server și
  conturi, adică exact ce e pe lista închisă din §3. *Provizoriu: nume local,
  atât. Dacă profilul trebuie arătat cuiva, drumul e fișierul de export de la
  pasul 9, nu un server.*
- **Î-18.** Ce se ia în depozit la instalare? Exportul are ~48 MB, din care
  31 MB sunt Pyodide și PGlite; o instalare care le cere pe toate dinainte ar
  însemna 48 MB pentru un buton. *Provizoriu: coaja (paginile, CSS-ul, JS-ul,
  2,3 MB) se ia la instalare; motoarele se rețin pe drum, pe măsură ce le
  ceri, iar ecranul „Aplicația" are un buton care le aduce dinadins. Depozitul
  coajei se aruncă la fiecare versiune nouă, al motoarelor numai când se
  schimbă ele.*
