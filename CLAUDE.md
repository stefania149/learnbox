# Tutore — instrucțiuni pentru sesiunile de lucru

Un joc de învățat, care rulează întreg în browser. Fără server, fără cont, fără
costuri. Proiect personal, public pe GitHub, folosit și ca piesă de portofoliu.

## Documentele

| Document | Ce conține |
|---|---|
| `PLAN.md` | **Adevărul.** Ce construim, de ce, în ce ordine. Cele zece principii sunt în §2 |
| `STADIU.md` | **Unde suntem.** Toți pașii, cu status. Se citește la început și se scrie la final |

Dacă apare o contradicție între cod și `PLAN.md`, planul are dreptate. Dacă
planul e greșit, se corectează planul — nu se improvizează în cod.

## Prima și ultima acțiune a fiecărei sesiuni

**La început:** citește `STADIU.md`. Nu presupune că un pas e gata pentru că
există cod — dacă rândul nu e `Terminat`, nu e.

**La final:** actualizează `STADIU.md`, chiar dacă pasul nu s-a terminat.
Notițele conțin doar ce are efect pe viitor: o abatere de la plan, o limitare de
reparat, o decizie provizorie. Maximum două propoziții. „A mers bine" nu se
scrie.

O **întrebare deschisă** se scrie în `PLAN.md` §15, nu în `STADIU.md`.

Nu se adaugă pași noi în `STADIU.md` fără să existe în `PLAN.md` §13.

## Cele zece reguli care nu se negociază

Sunt principiile din `PLAN.md` §2, în forma pe care o calcă un agent primul.

1. **Verdictul nu trece niciodată prin model.** Codul utilizatorului se rulează
   pe cazuri de test și se compară rezultatele. Un model care „evaluează dacă
   răspunsul e corect" la un exercițiu cu execuție e o greșeală de arhitectură,
   nu o scurtătură.

2. **Mascota nu e asistentul.** Mascota e date: animație, sunet, replică dintr-o
   listă scrisă de mână. **Zero apeluri de model.** Nu ține minte nimic, nu
   poartă conversații.

3. **Asistentul nu laudă, nu consolează, nu inițiază.** Fără „Bravo!", fără
   „Ai reușit!", fără „cum te simți?", fără mesaje care apar singure după o
   greșeală. Răspunde când e întrebat. Reacția la reușită e a jocului: XP, nivel
   deblocat, mascotă.

4. **XP-ul măsoară efortul, nu corectitudinea.** Orice încercare dă XP. Fiecare
   caz de test care trece dă XP. **Nu există XP negativ, pierdere sau
   penalizare.** Nicăieri pe ecran nu apare un număr roșu care scade.

5. **Totul merge fără model.** Orice funcție care cere AI are cale de rezervă
   scrisă dinainte. Cursurile livrate, exercițiile, verdictele, XP-ul, temele și
   Arhiva funcționează pe un laptop fără WebGPU. Un ecran care se strică fără
   model e un ecran nefăcut.

6. **Fără server.** Export static, tot calculul la utilizator. Fără rute API,
   fără Server Actions, fără nimic care presupune Node la rulare.

7. **Pyodide rulează doar în Web Worker**, cu cronometru și repornire. Niciodată
   pe firul principal, nici măcar „temporar, ca să văd dacă merge".

8. **`incercare` e imutabilă.** Fără `UPDATE`, fără `DELETE`. O reluare se scrie
   ca rând nou. Istoricul greșelilor e ce face Arhiva posibilă.

9. **Temele sunt date, nu cod.** Niciun ecran nu știe ce temă e activă; citește
   tokenuri. Testul: se adaugă o temă nouă fără să atingi un singur ecran.

10. **Memoria reține doar ce schimbă conținutul** — facultate, examen, materii
    făcute, lungimea sesiunilor. Nu stări emoționale, nu ce-l motivează, nu ce-l
    frustrează. Vizibilă și ștergibilă de utilizator, rând cu rând.

## Vocabularul

| În model / DB | Pe ecran |
|---|---|
| `materie` | **Curs** — și numele ei propriu („Python") |
| `capitol` | **Capitol** |
| `nivel` | **Lecție** |
| `exercitiu` | **Exercițiu** |
| `incercare` | **Încercare** |
| `stapanire` | nu apare pe ecran |
| asistentul | **Asistent** — niciodată „însoțitor", „prieten", „tutorele tău" |

**Cuvinte care nu apar pe ecran, niciodată:** „Bravo", „Felicitări", „Ai
eșuat", „Greșit" singur fără explicație, „Ai pierdut", „Încearcă din nou" ca
singur mesaj, orice număr negativ de XP.

## Convenții de cod

- **Română fără diacritice** în schemă și în stratul de domeniu (`unitate`,
  `incercare`, `stapanire`). Cod tehnic și biblioteci în engleză. **UI 100%
  română, cu diacritice.**
- **XP-ul e întreg.** Niciodată float, niciodată `toFixed`.
- **Migrări `drizzle-kit`**, numerotate, comise în repo. Nici în prototip nu se
  regenerează schema peste ea. O migrare comisă nu se editează — se scrie una
  nouă.
- **Datele stau în PGlite peste IndexedDB.** Tot accesul trece prin Drizzle.
- **Un singur fișier decide dacă există model: `lib/rutare-model.ts`.** Nicio
  altă bucată de cod nu întreabă „avem WebGPU?".

## Design UI

Direcția: **simplu, modern, clar, bine structurat.** Concret:

- **Modularitate.** Structura unui ecran (antet, conținut, bară de acțiuni) se
  definește o dată, ca set de componente proprii, și se refolosește. Nu se
  re-desenează per ecran.
- **Consistență.** Ecrane de același tip arată la fel: aceleași poziții,
  aceeași paletă, aceeași tipografie.
- **Totul prin tokenuri de temă** (regula 9). Nicio culoare scrisă direct
  într-un ecran.

## Cum se termină un pas

Nu e terminat până nu trec toate cinci:

1. Se face **din interfață**, nu din consolă.
2. **Datele ajung unde trebuie** și se văd pe ecran.
3. **Regula 4 e respectată** — nimic pe ecranul ăla nu demoralizează.
4. **Merge fără model** (regula 5), sau degradarea e explicită și testată.
5. **Îl folosești o sesiune reală.** Ce te enervează se repară acum.

Un ecran fără acțiuni nu e un pas terminat.

## Git — nimic fără voie

**Nu se dă `commit` și nu se dă `push` fără să întrebi și să primești „da".**
Valabil la fiecare pas și la fiecare subpas din plan, fără excepție: și pentru
un fișier, și pentru o corectură de o linie, și la finalul unei sesiuni care a
mers bine. Un „da" e pentru comiterea aceea, nu pentru următoarele.

Se lucrează normal în fișiere; la final se arată ce s-a schimbat și se cere
voie. Tot fără voie: `git push --force`, `reset --hard`, rescrierea istoriei,
ștergerea de ramuri, crearea unui repo sau a unui remote, publicarea pe GitHub
Pages.

## Ce nu se construiește — listă închisă

Motivele sunt în `PLAN.md` §3. Se recitesc înainte de a se rediscuta.

Server, backend, conturi, autentificare · sincronizare între dispozitive ·
multiplayer, clasamente, comparație cu alți utilizatori · serii zilnice cu
pierdere · aplicație mobilă nativă · magazin, monede, abonament, reclame ·
import video/audio · personaje sau muzică din francize existente · editor de
curs manual.

## Regula de aur

Dacă ceva nu e specificat în `PLAN.md`, **nu inventa.** Alege varianta cea mai
simplă și reversibilă, scrie întrebarea în `PLAN.md` §15, mergi mai departe.
