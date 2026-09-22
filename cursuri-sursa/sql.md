# SQL — Întrebări puse unui tabel

Motor: sql

**Materia:** SQL
**Capitolul:** Întrebări puse unui tabel
**Pentru cine:** cineva care a mai scris cod (a trecut prin cursul de Python
sau știe altceva), dar n-a atins niciodată o bază de date. Nu presupune că știe
ce e un tabel, o coloană sau un rând.

**Cele cinci lecții, în ordine:**

1. **Ce ceri și de unde** — `SELECT`, lista de coloane, `FROM`, apoi `WHERE`
   cu comparații simple. Un singur tabel, puține rânduri, totul se poate
   număra cu ochiul.
2. **Ordinea nu vine de la sine** — `ORDER BY`, `ASC`/`DESC`, `LIMIT`. Aici se
   spune limpede că fără `ORDER BY` baza nu promite nicio ordine, și de ce.
3. **Numărat și adunat** — `COUNT`, `SUM`, `MIN`, `MAX`, `ROUND(AVG(...), 2)`.
   Un singur rând iese la capăt. Capcana: `COUNT(*)` numără rândurile,
   `COUNT(coloana)` sare peste `NULL`.
4. **Câte unul pentru fiecare grup** — `GROUP BY`, și `HAVING` ca filtru de
   după grupare. Diferența dintre `WHERE` (filtrează rânduri) și `HAVING`
   (filtrează grupuri) e miezul lecției.
5. **Două tabele deodată** — `JOIN ... ON`, și capcana capitolului: un `JOIN`
   obișnuit aruncă rândurile fără pereche. `LEFT JOIN` le ține, dar atunci apar
   `NULL`-uri, iar `NULL` nu se compară cu `=`. Aici se pierde lumea.

**Lungime:** trei ecrane de briefing per lecție, trei exerciții per lecție.

**Tabelele folosite:** una-două lumi mici, reluate de la o lecție la alta, ca
să nu se învețe de fiecare dată alte nume. Propunere: `angajat` (nume,
departament, salariu, sef) și `departament` (nume, oras) pentru lecția cu
`JOIN`. Nume de coloane în română fără diacritice.

**Ton:** direct, scurt, fără entuziasm. Se explică ce face interogarea, nu cât
e de puternic SQL-ul.
