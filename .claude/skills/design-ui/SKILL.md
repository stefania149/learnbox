---
name: design-ui
description: Catalog de anti-tipare de design pentru interfețe generate cu AI — „AI slop", semne de template, greșeli de accesibilitate, microcopy, stări goale și de eroare. Se folosește înainte de a scrie un ecran nou sau o componentă vizuală, și ca listă de verificare înainte de a considera un ecran terminat.
---

# Design UI — ce să nu faci

Documentul complet e în `references/antipatterns.md`: zece părți, de la catalogul de
anti-tipare până la sisteme de design. Se citește selectiv, nu tot.

## Când se citește ce

| Situație | Secțiunea |
|---|---|
| Înainte de un ecran nou | Partea 3 (testul de intenție), Partea 4 (principii) |
| Înainte de a declara un ecran terminat | Partea 2 (lista de verificare) |
| Culori, spațiere, tipografie | 4.2–4.6 |
| Butoane, focus, contrast, țintă de atingere | Partea 5 |
| Ecran fără date, eroare, text lung | Partea 7 |
| Text de buton, etichete, mesaje de eroare | Partea 8 |

## Verificările care cad cel mai des la noi

- **Ținta de atingere sub 44×44px** — butoanele mici trec neobservate la revizuire.
- **Favicon implicit, fără `og:image`, fără 404 propriu** — semne de „nefinisat".
- **Culori scrise direct** — la noi e și regula 9 din `CLAUDE.md`, nu doar igienă.
- **Stare goală și stare de eroare nedesenate** — se văd abia când se strică ceva.
- **Text de buton generic** — „Trimite", „Continuă" fără obiect.

## Ce se ignoră aici

Părțile despre pagini de prezentare, prețuri, testimoniale și dovadă socială
(1.16–1.19, Partea 9) nu se aplică: Tutore n-are pagină de vânzare, n-are conturi
și nu vinde nimic. Se sare peste ele fără discuție.
