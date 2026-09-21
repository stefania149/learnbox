/**
 * Capitolul livrat: „Funcții și bucle". Scris de mână, cap-coadă.
 *
 * Ordinea e cea din `PLAN.md` §5 și §7: briefing de 2-4 ecrane, apoi 3-6
 * exerciții crescătoare, în ordinea „completează → repară → scrie".
 *
 * Fiecare exercițiu are `explicatie_predefinita`: fără ea, cine n-are model
 * n-ar primi niciun răspuns util (principiul 10).
 *
 * Enunțurile sunt cheia după care se recunosc exercițiile deja livrate, deci
 * nu se rescriu — un enunț schimbat înseamnă un exercițiu nou. Formatul cu
 * chei stabile vine la pasul 11.
 */
import type { CazTest } from "@/lib/exercitii/motor";

export type EcranBriefing = { titlu: string; text: string; cod?: string };

export type ExercitiuLivrat = {
  tip: "completeaza" | "repara" | "scrie";
  enunt: string;
  codInitial: string;
  solutie: string;
  cazuriTest: CazTest[];
  explicatiePredefinita: string;
};

export type NivelLivrat = {
  nume: string;
  briefing: EcranBriefing[];
  exercitii: ExercitiuLivrat[];
};

export type CapitolLivrat = {
  nume: string;
  niveluri: NivelLivrat[];
};

/** Cursul din care face parte capitolul. Pe ecran apare ca nume propriu. */
export const MATERIE = "Python";

export const CAPITOL: CapitolLivrat = {
  nume: "Funcții și bucle",
  niveluri: [
    // —— Lecția 1 ————————————————————————————————————————————
    {
      nume: "Funcții care întorc un număr",
      briefing: [
        {
          titlu: "O funcție e un nume pus pe niște treabă",
          text:
            "Scrii o dată cum se face ceva, îi dai un nume, și de atunci o chemi pe " +
            "nume. `def` începe definiția, parantezele spun ce primește.",
          cod: `def dublu(n):
    return n * 2

dublu(21)`,
        },
        {
          titlu: "`return` trimite răspunsul înapoi",
          text:
            "Fără `return`, funcția face treaba și nu-ți dă nimic — primești `None`. " +
            "Asta e greșeala numărul unu la început, și nu dă niciun fel de eroare: " +
            "codul pare că merge, dar rezultatul lipsește.",
          cod: `def dublu(n):
    n * 2        # face înmulțirea și o aruncă

print(dublu(21))  # None`,
        },
        {
          titlu: "`if` alege între două drumuri",
          text:
            "Compari două valori și faci altceva după cum iese. Ce scrii indentat " +
            "sub `if` se întâmplă doar când condiția e adevărată; `else` prinde " +
            "restul cazurilor.",
          cod: `def semn(n):
    if n < 0:
        return "negativ"
    else:
        return "pozitiv sau zero"`,
        },
        {
          titlu: "Cum se verifică",
          text:
            "Fiecare exercițiu vine cu cazuri de test: se cheamă funcția ta cu niște " +
            "valori și se compară rezultatul cu cel așteptat. Compararea e strictă — " +
            "`1` și `1.0` sunt răspunsuri diferite. Nu te judecă nimeni, se rulează cod.",
        },
      ],
      exercitii: [
        {
          tip: "completeaza",
          enunt:
            "Funcția `dublu` trebuie să întoarcă numărul primit, înmulțit cu doi. " +
            "Completează golul.",
          codInitial: `def dublu(n):
    return n * ___
`,
          solutie: `def dublu(n):
    return n * 2
`,
          cazuriTest: [
            { apel: "dublu(3)", asteptat: "6" },
            { apel: "dublu(0)", asteptat: "0" },
            { apel: "dublu(-4)", asteptat: "-8" },
          ],
          explicatiePredefinita:
            "`___` nu e cod Python, e semnul golului: Python nu știe ce e și se " +
            "oprește cu `NameError`. Pune în locul lui numărul cerut.",
        },
        {
          tip: "repara",
          enunt:
            "`aduna` trebuie să întoarcă suma celor două numere, dar întoarce " +
            "altceva. Repar-o.",
          codInitial: `def aduna(a, b):
    return a - b
`,
          solutie: `def aduna(a, b):
    return a + b
`,
          cazuriTest: [
            { apel: "aduna(2, 3)", asteptat: "5" },
            { apel: "aduna(0, 0)", asteptat: "0" },
            { apel: "aduna(-1, 1)", asteptat: "0" },
            { apel: "aduna(10, -4)", asteptat: "6" },
          ],
          explicatiePredefinita:
            "Un singur semn e greșit. Uită-te la ce cer cazurile: `aduna(2, 3)` " +
            "trebuie să dea `5`, iar `2 - 3` dă `-1`.",
        },
        {
          tip: "scrie",
          enunt:
            "Scrie `diferenta`, care întoarce cu cât diferă două numere. " +
            "Rezultatul nu e niciodată negativ.",
          codInitial: `def diferenta(a, b):
    ...
`,
          solutie: `def diferenta(a, b):
    if a > b:
        return a - b
    else:
        return b - a
`,
          cazuriTest: [
            { apel: "diferenta(5, 3)", asteptat: "2" },
            { apel: "diferenta(3, 5)", asteptat: "2" },
            { apel: "diferenta(4, 4)", asteptat: "0" },
            { apel: "diferenta(-2, 3)", asteptat: "5" },
          ],
          explicatiePredefinita:
            "`a - b` merge doar când `a` e mai mare. Când nu e, scade invers — " +
            "sau folosește `abs(a - b)`, care face exact asta. `...` în corp " +
            "înseamnă că funcția nu întoarce nimic, deci vei primi `None`.",
        },
        {
          tip: "scrie",
          enunt:
            "Scrie `maxim_din_doua`, care întoarce numărul mai mare dintre cele " +
            "două. Când sunt egale, întoarce-l pe oricare.",
          codInitial: `def maxim_din_doua(a, b):
    ...
`,
          solutie: `def maxim_din_doua(a, b):
    if a > b:
        return a
    return b
`,
          cazuriTest: [
            { apel: "maxim_din_doua(3, 7)", asteptat: "7" },
            { apel: "maxim_din_doua(7, 3)", asteptat: "7" },
            { apel: "maxim_din_doua(4, 4)", asteptat: "4" },
            { apel: "maxim_din_doua(-1, -5)", asteptat: "-1" },
          ],
          explicatiePredefinita:
            "Cazul cu numere negative prinde presupunerea că mai mare ar " +
            "însemna mai departe de zero: `-1` e mai mare decât `-5`. " +
            "Compară-le direct, nu prin alt calcul.",
        },
      ],
    },

    // —— Lecția 2 ————————————————————————————————————————————
    {
      nume: "Bucle peste o listă",
      briefing: [
        {
          titlu: "`for` trece prin listă, element cu element",
          text:
            "Nu numeri tu pozițiile: `for` îți dă pe rând fiecare element. Ce scrii " +
            "indentat sub el se întâmplă o dată pentru fiecare.",
          cod: `for n in [3, 1, 4]:
    print(n)`,
        },
        {
          titlu: "Un acumulator ține minte între pași",
          text:
            "Bucla uită tot la fiecare pas, așa că ce vrei să păstrezi ții într-o " +
            "variabilă pornită **înainte** de buclă — un total, un contor, o listă " +
            "nouă. La final o întorci.",
          cod: `total = 0
for n in [3, 1, 4]:
    total += n
print(total)   # 8`,
        },
        {
          titlu: "Lista goală e tot un caz",
          text:
            "Când lista e goală, bucla nu se execută niciun pas — iar funcția " +
            "întoarce exact ce ai pus în acumulator la început. De-aia un total " +
            "pornește de la `0`: pe listă goală dă `0`, nu eroare.",
          cod: `def suma(numere):
    total = 0        # asta se întoarce pe listă goală
    for n in numere:
        total += n
    return total`,
        },
      ],
      exercitii: [
        {
          tip: "completeaza",
          enunt:
            "`cate_elemente` numără câte numere are lista, fără `len`. " +
            "Completează cu cât crește contorul la fiecare pas.",
          codInitial: `def cate_elemente(numere):
    cate = 0
    for n in numere:
        cate += ___
    return cate
`,
          solutie: `def cate_elemente(numere):
    cate = 0
    for n in numere:
        cate += 1
    return cate
`,
          cazuriTest: [
            { apel: "cate_elemente([4, 5, 6])", asteptat: "3" },
            { apel: "cate_elemente([])", asteptat: "0" },
            { apel: "cate_elemente([9])", asteptat: "1" },
          ],
          explicatiePredefinita:
            "Contorul nu adună valorile, ci numără pașii: la fiecare element " +
            "crește cu unu, oricât de mare ar fi elementul.",
        },
        {
          tip: "repara",
          enunt:
            "`total_preturi` ar trebui să adune toate prețurile, dar se oprește " +
            "după primul. Repar-o.",
          codInitial: `def total_preturi(preturi):
    total = 0
    for p in preturi:
        total += p
        return total
`,
          solutie: `def total_preturi(preturi):
    total = 0
    for p in preturi:
        total += p
    return total
`,
          cazuriTest: [
            { apel: "total_preturi([10, 20, 30])", asteptat: "60" },
            { apel: "total_preturi([7])", asteptat: "7" },
            { apel: "total_preturi([])", asteptat: "0" },
          ],
          explicatiePredefinita:
            "`return` iese din funcție pe loc, nu doar din buclă. Fiind indentat " +
            "sub `for`, se execută la primul element și restul listei nu mai e " +
            "văzut. Scoate-l din buclă, la același nivel cu `for`.",
        },
        {
          tip: "scrie",
          enunt:
            "Scrie `suma`, care întoarce suma numerelor primite. Antetul e dat; " +
            "corpul e al tău.",
          codInitial: `def suma(numere):
    ...
`,
          solutie: `def suma(numere):
    total = 0
    for n in numere:
        total += n
    return total
`,
          cazuriTest: [
            { apel: "suma([1, 2, 3])", asteptat: "6" },
            { apel: "suma([])", asteptat: "0" },
            { apel: "suma([-1, 1])", asteptat: "0" },
            { apel: "suma([0.5, 0.5])", asteptat: "1.0" },
            { apel: "suma(range(1000))", asteptat: "499500" },
          ],
          explicatiePredefinita:
            "Două capcane: lista goală trebuie să dea `0`, nu eroare; iar " +
            "`0.5 + 0.5` dă `1.0`, nu `1` — Python ține minte că a socotit cu " +
            "zecimale, iar cazul cere exact `1.0`.",
        },
      ],
    },

    // —— Lecția 3 ————————————————————————————————————————————
    {
      nume: "Condiții înăuntrul buclei",
      briefing: [
        {
          titlu: "`if` în buclă alege ce intră la socoteală",
          text:
            "Bucla trece prin tot, iar `if` hotărăște ce se numără și ce nu. Așa " +
            "se filtrează fără să sari niciun element.",
          cod: `cate = 0
for n in [3, 1, 4]:
    if n > 2:
        cate += 1
print(cate)   # 2`,
        },
        {
          titlu: "Restul împărțirii spune dacă e par",
          text:
            "`%` dă restul. Un număr e par când restul împărțirii la doi e zero. " +
            "Merge și pe negative: `-4 % 2` e tot `0`.",
          cod: `7 % 2   # 1, deci impar
8 % 2   # 0, deci par`,
        },
        {
          titlu: "Un candidat care se înlocuiește",
          text:
            "Ca să găsești cel mai mare element, ții minte un candidat și îl " +
            "înlocuiești când dai peste unul mai bun. Candidatul de pornire se ia " +
            "din listă, nu îl alegi tu — altfel funcția poate întoarce un număr " +
            "care nici nu era acolo.",
          cod: `cel_mai_mare = numere[0]
for n in numere:
    if n > cel_mai_mare:
        cel_mai_mare = n`,
        },
      ],
      exercitii: [
        {
          tip: "completeaza",
          enunt:
            "`cate_pare` numără câte numere pare sunt în listă. Completează golul " +
            "din condiție.",
          codInitial: `def cate_pare(numere):
    cate = 0
    for n in numere:
        if n % 2 == ___:
            cate += 1
    return cate
`,
          solutie: `def cate_pare(numere):
    cate = 0
    for n in numere:
        if n % 2 == 0:
            cate += 1
    return cate
`,
          cazuriTest: [
            { apel: "cate_pare([1, 2, 3, 4])", asteptat: "2" },
            { apel: "cate_pare([])", asteptat: "0" },
            { apel: "cate_pare([2, 4, 6])", asteptat: "3" },
            { apel: "cate_pare([-2, -1])", asteptat: "1" },
          ],
          explicatiePredefinita:
            "`n % 2` dă restul împărțirii la doi: `0` pentru numere pare, `1` " +
            "pentru impare. Condiția trebuie să compare restul cu `0`.",
        },
        {
          tip: "repara",
          enunt:
            "`maxim` trebuie să întoarcă cel mai mare număr dintr-o listă. Merge " +
            "pe numere pozitive, dar nu și pe negative. Repar-o.",
          codInitial: `def maxim(numere):
    cel_mai_mare = 0
    for n in numere:
        if n > cel_mai_mare:
            cel_mai_mare = n
    return cel_mai_mare
`,
          solutie: `def maxim(numere):
    cel_mai_mare = numere[0]
    for n in numere:
        if n > cel_mai_mare:
            cel_mai_mare = n
    return cel_mai_mare
`,
          cazuriTest: [
            { apel: "maxim([1, 5, 3])", asteptat: "5" },
            { apel: "maxim([2])", asteptat: "2" },
            { apel: "maxim([0, -3])", asteptat: "0" },
            { apel: "maxim([-4, -1, -7])", asteptat: "-1" },
          ],
          explicatiePredefinita:
            "Pornirea de la `0` presupune că lista are măcar un număr pozitiv. " +
            "Când toate sunt negative, `0` rămâne cel mai mare și iese un număr " +
            "care nici nu era în listă. Pornește de la primul element.",
        },
        {
          tip: "scrie",
          enunt:
            "Scrie `cate_lungi`, care numără câte cuvinte din listă au mai mult " +
            "de trei litere.",
          codInitial: `def cate_lungi(cuvinte):
    ...
`,
          solutie: `def cate_lungi(cuvinte):
    cate = 0
    for c in cuvinte:
        if len(c) > 3:
            cate += 1
    return cate
`,
          cazuriTest: [
            { apel: 'cate_lungi(["a", "abcd"])', asteptat: "1" },
            { apel: "cate_lungi([])", asteptat: "0" },
            { apel: 'cate_lungi(["mere", "pere"])', asteptat: "2" },
            { apel: 'cate_lungi(["ana", "bob"])', asteptat: "0" },
          ],
          explicatiePredefinita:
            "`len(c)` dă câte litere are cuvântul. Atenție la cerință: un cuvânt " +
            "de exact trei litere nu se numără, deci condiția e `> 3`, nu `>= 3`.",
        },
        {
          tip: "scrie",
          enunt:
            "Scrie `cel_mai_mic`, care întoarce cel mai mic număr din listă, " +
            "fără să folosești `min`.",
          codInitial: `def cel_mai_mic(numere):
    ...
`,
          solutie: `def cel_mai_mic(numere):
    cel_mic = numere[0]
    for n in numere:
        if n < cel_mic:
            cel_mic = n
    return cel_mic
`,
          cazuriTest: [
            { apel: "cel_mai_mic([3, 1, 2])", asteptat: "1" },
            { apel: "cel_mai_mic([4])", asteptat: "4" },
            { apel: "cel_mai_mic([-1, -5])", asteptat: "-5" },
            { apel: "cel_mai_mic([2, 2])", asteptat: "2" },
          ],
          explicatiePredefinita:
            "E `maxim` întors pe dos: ții minte un candidat și îl înlocuiești " +
            "când găsești unul mai mic. Candidatul de pornire trebuie luat din " +
            "listă, nu ales de tine — `0` ar strica lista cu numere pozitive.",
        },
      ],
    },

    // —— Lecția 4 ————————————————————————————————————————————
    {
      nume: "Liste noi din liste vechi",
      briefing: [
        {
          titlu: "Acumulatorul poate fi o listă",
          text:
            "Pornești de la o listă goală și adaugi în ea, la fiecare pas, ce vrei " +
            "să păstrezi. `append` pune un element la coadă.",
          cod: `rezultat = []
for n in [1, 2, 3]:
    rezultat.append(n * 10)
print(rezultat)   # [10, 20, 30]`,
        },
        {
          titlu: "Lista primită rămâne neatinsă",
          text:
            "Construiești o listă **nouă** și o întorci. Cine te-a chemat păstrează " +
            "lista lui așa cum era — asta e ce face funcția ușor de folosit de două " +
            "ori la rând, cu același rezultat.",
        },
        {
          titlu: "`append` nu întoarce nimic",
          text:
            "`rezultat.append(x)` schimbă lista și întoarce `None`. Dacă scrii " +
            "`rezultat = rezultat.append(x)`, pierzi lista și rămâi cu `None`. " +
            "Cheamă-l simplu, pe un rând al lui.",
          cod: `rezultat.append(x)          # așa
rezultat = rezultat.append(x)  # așa se pierde lista`,
        },
      ],
      exercitii: [
        {
          tip: "repara",
          enunt:
            "`doar_pare` adună numerele pare într-o listă nouă, dar cine o cheamă " +
            "primește `None`. Repar-o.",
          codInitial: `def doar_pare(numere):
    rezultat = []
    for n in numere:
        if n % 2 == 0:
            rezultat.append(n)
`,
          solutie: `def doar_pare(numere):
    rezultat = []
    for n in numere:
        if n % 2 == 0:
            rezultat.append(n)
    return rezultat
`,
          cazuriTest: [
            { apel: "doar_pare([1, 2, 3, 4])", asteptat: "[2, 4]" },
            { apel: "doar_pare([])", asteptat: "[]" },
            { apel: "doar_pare([1, 3])", asteptat: "[]" },
          ],
          explicatiePredefinita:
            "Lista se construiește corect, dar nu iese nicăieri din funcție. " +
            "Fără `return`, Python întoarce `None` — exact ce se vede în cazuri.",
        },
        {
          tip: "scrie",
          enunt:
            "Scrie `dubleaza`, care întoarce o listă nouă, cu fiecare număr " +
            "înmulțit cu doi. Lista primită rămâne neatinsă.",
          codInitial: `def dubleaza(numere):
    ...
`,
          solutie: `def dubleaza(numere):
    rezultat = []
    for n in numere:
        rezultat.append(n * 2)
    return rezultat
`,
          cazuriTest: [
            { apel: "dubleaza([1, 2, 3])", asteptat: "[2, 4, 6]" },
            { apel: "dubleaza([])", asteptat: "[]" },
            { apel: "dubleaza([-1, 0])", asteptat: "[-2, 0]" },
          ],
          explicatiePredefinita:
            "Două lucruri se uită des aici: lista nouă trebuie pornită goală " +
            "înainte de buclă (`rezultat = []`), și trebuie întoarsă la final cu " +
            "`return`. Fără `return`, iese `None`.",
        },
        {
          tip: "scrie",
          enunt:
            "Scrie `majuscule`, care întoarce o listă nouă cu fiecare cuvânt " +
            "scris cu litere mari. `\"ana\".upper()` dă `\"ANA\"`.",
          codInitial: `def majuscule(cuvinte):
    ...
`,
          solutie: `def majuscule(cuvinte):
    rezultat = []
    for c in cuvinte:
        rezultat.append(c.upper())
    return rezultat
`,
          cazuriTest: [
            { apel: 'majuscule(["ana", "bob"])', asteptat: "['ANA', 'BOB']" },
            { apel: "majuscule([])", asteptat: "[]" },
            { apel: 'majuscule(["da"])', asteptat: "['DA']" },
          ],
          explicatiePredefinita:
            "`c.upper()` întoarce un cuvânt nou; nu-l schimbă pe cel vechi, deci " +
            "trebuie pus în listă. Rezultatul e o listă de cuvinte, nu un cuvânt " +
            "lipit.",
        },
        {
          tip: "scrie",
          enunt:
            "Scrie `inversata`, care întoarce o listă nouă cu aceleași numere, " +
            "în ordine inversă.",
          codInitial: `def inversata(numere):
    ...
`,
          solutie: `def inversata(numere):
    rezultat = []
    for n in numere:
        rezultat.insert(0, n)
    return rezultat
`,
          cazuriTest: [
            { apel: "inversata([1, 2, 3])", asteptat: "[3, 2, 1]" },
            { apel: "inversata([])", asteptat: "[]" },
            { apel: "inversata([7])", asteptat: "[7]" },
            { apel: "inversata([1, 1, 2])", asteptat: "[2, 1, 1]" },
          ],
          explicatiePredefinita:
            "Merge în mai multe feluri: pui fiecare element la începutul listei " +
            "noi cu `insert(0, n)`, sau întorci o felie inversată cu " +
            "`numere[::-1]`. Ce nu merge e `numere.reverse()`: schimbă lista " +
            "primită și întoarce `None`.",
        },
      ],
    },

    // —— Lecția 5 ————————————————————————————————————————————
    {
      nume: "Când bucla nu se oprește",
      briefing: [
        {
          titlu: "`while` repetă cât timp condiția e adevărată",
          text:
            "`for` știe dinainte prin ce trece. `while` nu: repetă atâta timp cât " +
            "condiția rămâne adevărată, și verifică din nou înainte de fiecare pas.",
          cod: `i = 0
while i < 3:
    print(i)
    i += 1`,
        },
        {
          titlu: "Ceva dinăuntru trebuie să schimbe condiția",
          text:
            "Dacă nimic din corpul buclei nu apropie condiția de fals, bucla nu se " +
            "termină niciodată. De obicei lipsește exact rândul care schimbă " +
            "variabila din condiție.",
          cod: `i = 0
while i < 3:
    print(i)     # i nu se schimbă niciodată:
                 # bucla asta nu se oprește`,
        },
        {
          titlu: "Aici o buclă fără sfârșit nu strică nimic",
          text:
            "Codul tău rulează pe un fir separat, cu cronometru. Dacă trece de " +
            "cinci secunde, firul se oprește și repornește singur, iar tu primești " +
            "un mesaj în loc de o filă înghețată. Ce cazuri trecuseră până atunci " +
            "rămân trecute.",
        },
      ],
      exercitii: [
        {
          tip: "completeaza",
          enunt:
            "`numara_pana_la` numără de la zero până la `n`. Completează cu cât " +
            "crește `i` la fiecare pas — atenție, de răspunsul ăsta depinde dacă " +
            "bucla se mai oprește.",
          codInitial: `def numara_pana_la(n):
    i = 0
    cate = 0
    while i < n:
        cate += 1
        i += ___
    return cate
`,
          solutie: `def numara_pana_la(n):
    i = 0
    cate = 0
    while i < n:
        cate += 1
        i += 1
    return cate
`,
          cazuriTest: [
            { apel: "numara_pana_la(3)", asteptat: "3" },
            { apel: "numara_pana_la(0)", asteptat: "0" },
            { apel: "numara_pana_la(1)", asteptat: "1" },
          ],
          explicatiePredefinita:
            "Cu `0` în gol, `i` rămâne zero, condiția `i < n` rămâne adevărată și " +
            "bucla nu se mai termină — cronometrul o oprește la cinci secunde. " +
            "`i` trebuie să crească, ca să ajungă la `n`.",
        },
        {
          tip: "repara",
          enunt:
            "`cate_injumatatiri` numără de câte ori poți împărți un număr la doi " +
            "până ajungi la unu. Așa cum e, nu se oprește. Repar-o.",
          codInitial: `def cate_injumatatiri(n):
    cate = 0
    while n > 1:
        cate += 1
    return cate
`,
          solutie: `def cate_injumatatiri(n):
    cate = 0
    while n > 1:
        cate += 1
        n = n // 2
    return cate
`,
          cazuriTest: [
            { apel: "cate_injumatatiri(8)", asteptat: "3" },
            { apel: "cate_injumatatiri(1)", asteptat: "0" },
            { apel: "cate_injumatatiri(5)", asteptat: "2" },
          ],
          explicatiePredefinita:
            "Contorul crește, dar `n` nu se schimbă, deci condiția `n > 1` rămâne " +
            "adevărată la nesfârșit. Lipsește împărțirea: `n = n // 2` — cu două " +
            "bare, ca să rămână număr întreg.",
        },
        {
          tip: "scrie",
          enunt:
            "Scrie `cate_cifre`, care întoarce câte cifre are un număr pozitiv. " +
            "`0` are o cifră.",
          codInitial: `def cate_cifre(n):
    ...
`,
          solutie: `def cate_cifre(n):
    if n == 0:
        return 1
    cate = 0
    while n > 0:
        cate += 1
        n = n // 10
    return cate
`,
          cazuriTest: [
            { apel: "cate_cifre(7)", asteptat: "1" },
            { apel: "cate_cifre(100)", asteptat: "3" },
            { apel: "cate_cifre(4096)", asteptat: "4" },
            { apel: "cate_cifre(0)", asteptat: "1" },
          ],
          explicatiePredefinita:
            "`n // 10` taie ultima cifră. Bucla merge până nu mai rămâne nimic, " +
            "dar pe `0` nu pornește deloc și ai ieși cu `0` cifre — de-aia zeroul " +
            "se tratează separat, înainte de buclă.",
        },
      ],
    },
  ],
};
