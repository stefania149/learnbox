## Motorul: Python

Codul rulează în Pyodide — CPython adevărat, în browser, cu mesajele lui de
eroare reale.

### Determinismul, concret

`input()` e interzis, `random` pornește de la o sămânță fixă, iar data și ora
sunt înghețate la `2024-01-01 12:00:00`. Nu scrie exerciții care depind de
ceas, de rețea sau de fișiere.

### Cazurile de test

Un caz e `{ "apel", "asteptat" }`. Se evaluează expresia din `apel`, se ia
`repr()` al valorii și se compară **text cu text** cu `asteptat`.

Deci `asteptat` e exact ce ar scrie `repr()`:

| Valoarea corectă | `asteptat` |
|---|---|
| numărul 6 | `"6"` |
| numărul 6.0 | `"6.0"` — **nu** `"6"` |
| textul „ana" | `"'ana'"` — cu apostrofuri înăuntru |
| lista [1, 2] | `"[1, 2]"` — cu spațiu după virgulă |
| lista goală | `"[]"` |
| `True` | `"True"` |
| `None` | `"None"` |

Greșeala cea mai des făcută aici e `"6"` în loc de `"6.0"` la o împărțire.
Împărțirea `/` dă întotdeauna float în Python.

`enunt` începe cu numele funcției între apostrofuri inverse sau cu
„Scrie `nume_functie`". `codInitial` la tipul `scrie` e antetul funcției.

### Un exercițiu întreg, ca exemplu

```json
{
  "tip": "completeaza",
  "enunt": "Funcția `dublu` trebuie să întoarcă numărul primit, înmulțit cu doi. Completează golul.",
  "codInitial": "def dublu(n):\n    return n * ___\n",
  "solutie": "def dublu(n):\n    return n * 2\n",
  "cazuriTest": [
    { "apel": "dublu(3)", "asteptat": "6" },
    { "apel": "dublu(0)", "asteptat": "0" },
    { "apel": "dublu(-4)", "asteptat": "-8" }
  ],
  "explicatiePredefinita": "`___` nu e cod Python, e semnul golului: Python nu știe ce e și se oprește cu `NameError`. Pune în locul lui numărul cerut."
}
```
