## Motorul: SQL

Codul rulează într-un **Postgres adevărat**, compilat în WASM, pornit gol
pentru fiecare caz în parte. Nu e baza aplicației: nimic din ce se scrie
într-un exercițiu nu supraviețuiește cazului.

Deci se poate cere orice: `SELECT`, `JOIN`, `GROUP BY`, `INSERT`, `UPDATE`,
`DELETE`. Tabelele nu există dinainte — le faci tu, în fiecare caz.

### Determinismul, concret

- **Fără `now()`, `current_date`, `random()`.** Dacă un exercițiu are nevoie de
  date calendaristice, scrie-le ca literali: `DATE '2024-03-01'`.
- **Orice interogare care întoarce mai mult de un rând are `ORDER BY`.** Fără
  el, Postgres nu promite nicio ordine, iar comparația ar fi pe noroc. Asta e
  și o lecție bună: spune-o în briefing.

### Cazurile de test

Un caz e `{ "apel", "pregatire", "asteptat" }`, plus `"verificare"` când e
nevoie:

- **`pregatire`** — instrucțiunile care fac tabelele și le umplu, rulate
  înaintea codului utilizatorului. `CREATE TABLE …; INSERT INTO … VALUES …;`
  Scrie-le întregi, în fiecare caz: cazurile nu se moștenesc între ele.
- **`apel`** — **eticheta** cazului, nu cod. Se vede pe ecran, lângă bifă:
  „trei angajați, unul fără șef", „tabel gol". Scurtă, în română.
- **`asteptat`** — rândurile ieșite, scrise ca JSON: o listă de liste, în
  ordinea coloanelor cerute.
- **`verificare`** — numai la exercițiile care cer `INSERT`, `UPDATE` sau
  `DELETE`: interogarea care se rulează **după** codul utilizatorului și ale
  cărei rânduri se compară cu `asteptat`. La exercițiile cu `SELECT` nu se pune;
  se compară rândurile ultimei instrucțiuni scrise de utilizator.

### Cum se scriu rândurile așteptate

Numele coloanelor nu intră în comparație, doar valorile, în ordinea din
`SELECT`. Tipurile contează:

| Ce întoarce Postgres | În `asteptat` |
|---|---|
| text | `"Ana"` |
| întreg, `count(*)` | `3` |
| `NULL` | `null` |
| adevărat / fals | `true` / `false` |
| **`numeric`, `avg`, `sum` peste numeric** | **text**: `"4000.00"` |
| niciun rând | lista goală: `[]` |

`numeric` e capcana. `AVG(salariu)` întoarce
`"4000.0000000000000000"`, nu `4000`. Scrie în soluție
`ROUND(AVG(salariu), 2)` și așteaptă `"4000.00"`. `SUM` peste o coloană
`integer` întoarce întreg, deci se scrie ca număr.

### Un exercițiu întreg, ca exemplu

```json
{
  "tip": "scrie",
  "enunt": "Scrie o interogare care întoarce numele și salariul angajaților cu salariul peste 3000, de la cel mai mare salariu la cel mai mic.",
  "codInitial": "SELECT nume, salariu\nFROM angajat\n-- pune condiția și ordinea\n",
  "solutie": "SELECT nume, salariu\nFROM angajat\nWHERE salariu > 3000\nORDER BY salariu DESC;\n",
  "cazuriTest": [
    {
      "apel": "patru angajați, doi peste prag",
      "pregatire": "CREATE TABLE angajat (nume text, salariu int);\nINSERT INTO angajat VALUES ('Ana', 5000), ('Ion', 2500), ('Maria', 4000), ('Radu', 3000);",
      "asteptat": "[[\"Ana\",5000],[\"Maria\",4000]]"
    },
    {
      "apel": "niciun angajat peste prag",
      "pregatire": "CREATE TABLE angajat (nume text, salariu int);\nINSERT INTO angajat VALUES ('Ion', 2500);",
      "asteptat": "[]"
    },
    {
      "apel": "tabel gol",
      "pregatire": "CREATE TABLE angajat (nume text, salariu int);",
      "asteptat": "[]"
    }
  ],
  "explicatiePredefinita": "Fără `WHERE` ies toți angajații, iar fără `ORDER BY` rândurile pot veni în orice ordine — Postgres nu promite niciuna. Condiția e strictă: 3000 nu e „peste 3000\"."
}
```

Și unul cu `verificare`, fiindcă schimbă datele în loc să le citească:

```json
{
  "tip": "scrie",
  "enunt": "Scrie o instrucțiune care mărește cu 10% salariul tuturor angajaților din departamentul „vanzari\".",
  "codInitial": "UPDATE angajat\n-- pune ce se schimbă și pentru cine\n",
  "solutie": "UPDATE angajat\nSET salariu = salariu * 1.1\nWHERE departament = 'vanzari';\n",
  "cazuriTest": [
    {
      "apel": "doi din trei sunt la vânzări",
      "pregatire": "CREATE TABLE angajat (nume text, departament text, salariu numeric);\nINSERT INTO angajat VALUES ('Ana','vanzari',1000),('Ion','contabilitate',1000),('Maria','vanzari',2000);",
      "verificare": "SELECT nume, ROUND(salariu, 2) FROM angajat ORDER BY nume;",
      "asteptat": "[[\"Ana\",\"1100.00\"],[\"Ion\",\"1000.00\"],[\"Maria\",\"2200.00\"]]"
    }
  ],
  "explicatiePredefinita": "Un `UPDATE` fără `WHERE` schimbă toate rândurile din tabel, nu doar pe cele cerute. Înmulțirea cu 1.1 e creșterea cu zece la sută."
}
```
