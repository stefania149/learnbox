/**
 * Formatul de curs livrat, și citirea lui cu verificare — pasul 11.
 *
 * Un curs livrat e un fișier JSON comis în repo, sub `public/cursuri/`. Nu
 * intră în bundle: se aduce cu `fetch` la prima deschidere, ca al doilea și al
 * treilea curs (pasul 13) să nu îngroașe pagina pentru cine nu le joacă.
 *
 * **Cheile sunt partea importantă.** Până aici, o lecție se recunoștea după
 * nume și un exercițiu după enunț, deci o virgulă schimbată într-un enunț
 * însemna un exercițiu nou și o încercare orfană. Acum fiecare capitol,
 * lecție și exercițiu are un `cheie` care nu se mai schimbă niciodată. Textul
 * se poate rescrie oricât.
 *
 * Verificarea nu e paranoia: fișierele sunt scrise de o unealtă (pasul 12),
 * iar o unealtă greșește tăcut. Mai bine cade la încărcare, cu un mesaj care
 * spune unde, decât să ajungă în bază un exercițiu fără cazuri de test.
 */
import type { CazTest, Limbaj } from "@/lib/exercitii/motor";

export const FORMAT = "tutore-curs";
export const VERSIUNE = 1;

export const LIMBAJE = ["python", "sql"] as const;

/**
 * Limbajul e al cursului întreg, nu al exercițiului: un capitol de SQL nu are
 * exerciții de Python în el. Lipsa lui înseamnă Python — așa erau scrise
 * fișierele înainte să existe al doilea motor, și n-are rost să se rescrie.
 */
export const LIMBAJ_IMPLICIT: Limbaj = "python";

export type EcranBriefing = { titlu: string; text: string; cod?: string };

export const TIPURI_EXERCITIU = [
  "completeaza",
  "repara",
  "scrie",
] as const;
export type TipExercitiu = (typeof TIPURI_EXERCITIU)[number];

export type ExercitiuLivrat = {
  cheie: string;
  tip: TipExercitiu;
  enunt: string;
  codInitial: string;
  solutie: string;
  cazuriTest: CazTest[];
  explicatiePredefinita: string;
};

/**
 * O întrebare de test: enunț, variante, una corectă, și explicația care se
 * arată după răspuns — și când ai nimerit, și când n-ai nimerit.
 *
 * Variante, nu cod scris: partea de scris cod o fac exercițiile. Testul
 * întreabă dacă ai înțeles **de ce**, iar răspunsul se compară mecanic, fără
 * niciun model (principiul 1), deci merge și pe un laptop gol (principiul 5).
 */
export type IntrebareTest = {
  cheie: string;
  intrebare: string;
  variante: string[];
  /** Indicele variantei corecte în `variante`. */
  corect: number;
  explicatie: string;
};

export type TestLivrat = {
  cheie: string;
  titlu: string;
  intrebari: IntrebareTest[];
};

export type NivelLivrat = {
  cheie: string;
  nume: string;
  briefing: EcranBriefing[];
  exercitii: ExercitiuLivrat[];
  /** Testul de la capătul lecției. Se poate sări (`PLAN.md` §5). */
  test?: TestLivrat;
};

export type CapitolLivrat = {
  cheie: string;
  nume: string;
  niveluri: NivelLivrat[];
  /** Testul de la capătul capitolului, peste tot ce s-a învățat în el. */
  test?: TestLivrat;
};

export type CursLivrat = {
  format: typeof FORMAT;
  versiune: number;
  /** Numele propriu al cursului, cel de pe ecran: „Python". */
  materie: string;
  /** Pe ce motor se rulează exercițiile cursului. */
  limbaj: Limbaj;
  capitole: CapitolLivrat[];
};

/** Greșeală în fișier, cu locul ei scris în românește. */
export class EroareFormat extends Error {
  constructor(unde: string, ce: string) {
    super(`${unde}: ${ce}`);
    this.name = "EroareFormat";
  }
}

function obiect(v: unknown, unde: string): Record<string, unknown> {
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    throw new EroareFormat(unde, "aștept un obiect");
  }
  return v as Record<string, unknown>;
}

function sir(v: unknown, unde: string, { gol = false } = {}): string {
  if (typeof v !== "string") throw new EroareFormat(unde, "aștept un text");
  if (!gol && v.trim() === "") throw new EroareFormat(unde, "textul e gol");
  return v;
}

function lista(v: unknown, unde: string, minim = 1): unknown[] {
  if (!Array.isArray(v)) throw new EroareFormat(unde, "aștept o listă");
  if (v.length < minim) {
    throw new EroareFormat(unde, `aștept cel puțin ${minim}`);
  }
  return v;
}

/**
 * Cheile se scriu cu litere mici, cifre și cratime. Restricția nu e de
 * frumusețe: cheia ajunge în adrese și în fișierul de progres, iar acolo o
 * cheie cu spații sau diacritice se codează diferit de la un loc la altul.
 */
const CHEIE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function cheie(v: unknown, unde: string): string {
  const c = sir(v, unde);
  if (!CHEIE.test(c)) {
    throw new EroareFormat(
      unde,
      "cheia se scrie cu litere mici fără diacritice, cifre și cratime",
    );
  }
  return c;
}

function unice(chei: string[], unde: string) {
  const vazute = new Set<string>();
  for (const c of chei) {
    if (vazute.has(c)) {
      throw new EroareFormat(unde, `cheia „${c}" apare de două ori`);
    }
    vazute.add(c);
  }
}

/**
 * Un caz, în funcție de limbaj.
 *
 * La Python, `apel` e expresia care se evaluează. La SQL nu se evaluează
 * nimic scris de noi: `apel` e eticheta cazului, cea din raport, iar datele
 * vin din `pregatire`. Câmpurile de SQL într-un curs de Python se resping —
 * n-ar fi rulate niciodată, deci ar fi o promisiune mincinoasă în fișier.
 */
function citesteCaz(v: unknown, unde: string, limbaj: Limbaj): CazTest {
  const o = obiect(v, unde);
  const caz: CazTest = {
    apel: sir(o.apel, `${unde}.apel`),
    // `asteptat` poate fi text gol: o funcție care întoarce `""` e un caz bun.
    asteptat: sir(o.asteptat, `${unde}.asteptat`, { gol: true }),
  };

  if (limbaj === "sql") {
    caz.pregatire = sir(o.pregatire, `${unde}.pregatire`);
    if (o.verificare !== undefined) {
      caz.verificare = sir(o.verificare, `${unde}.verificare`);
    }
    return caz;
  }

  for (const nume of ["pregatire", "verificare"]) {
    if (o[nume] !== undefined) {
      throw new EroareFormat(`${unde}.${nume}`, "e numai pentru cursurile de SQL");
    }
  }
  return caz;
}

function citesteEcran(v: unknown, unde: string): EcranBriefing {
  const o = obiect(v, unde);
  return {
    titlu: sir(o.titlu, `${unde}.titlu`),
    text: sir(o.text, `${unde}.text`),
    ...(o.cod === undefined ? {} : { cod: sir(o.cod, `${unde}.cod`) }),
  };
}

function citesteExercitiu(
  v: unknown,
  unde: string,
  limbaj: Limbaj,
): ExercitiuLivrat {
  const o = obiect(v, unde);
  const tip = sir(o.tip, `${unde}.tip`);
  if (!(TIPURI_EXERCITIU as readonly string[]).includes(tip)) {
    throw new EroareFormat(
      `${unde}.tip`,
      `„${tip}" nu e un tip cunoscut (${TIPURI_EXERCITIU.join(", ")})`,
    );
  }
  const cazuri = lista(o.cazuriTest, `${unde}.cazuriTest`).map((c, i) =>
    citesteCaz(c, `${unde}.cazuriTest[${i}]`, limbaj),
  );
  return {
    cheie: cheie(o.cheie, `${unde}.cheie`),
    tip: tip as TipExercitiu,
    enunt: sir(o.enunt, `${unde}.enunt`),
    codInitial: sir(o.codInitial, `${unde}.codInitial`, { gol: true }),
    solutie: sir(o.solutie, `${unde}.solutie`),
    // Fără ea, cine n-are model nu primește niciun răspuns (principiul 5).
    explicatiePredefinita: sir(
      o.explicatiePredefinita,
      `${unde}.explicatiePredefinita`,
    ),
    cazuriTest: cazuri,
  };
}

function citesteIntrebare(v: unknown, unde: string): IntrebareTest {
  const o = obiect(v, unde);
  const variante = lista(o.variante, `${unde}.variante`, 2).map((t, i) =>
    sir(t, `${unde}.variante[${i}]`),
  );

  const corect = o.corect;
  if (
    typeof corect !== "number" ||
    !Number.isInteger(corect) ||
    corect < 0 ||
    corect >= variante.length
  ) {
    throw new EroareFormat(
      `${unde}.corect`,
      `aștept numărul variantei corecte, de la 0 la ${variante.length - 1}`,
    );
  }

  return {
    cheie: cheie(o.cheie, `${unde}.cheie`),
    intrebare: sir(o.intrebare, `${unde}.intrebare`),
    variante,
    corect,
    // Se arată și la răspunsul bun: testul e tot o ocazie de învățat, nu o notă.
    explicatie: sir(o.explicatie, `${unde}.explicatie`),
  };
}

function citesteTest(v: unknown, unde: string): TestLivrat {
  const o = obiect(v, unde);
  const intrebari = lista(o.intrebari, `${unde}.intrebari`).map((i, k) =>
    citesteIntrebare(i, `${unde}.intrebari[${k}]`),
  );
  unice(
    intrebari.map((i) => i.cheie),
    `${unde}.intrebari`,
  );
  return {
    cheie: cheie(o.cheie, `${unde}.cheie`),
    titlu: sir(o.titlu, `${unde}.titlu`),
    intrebari,
  };
}

function citesteNivel(v: unknown, unde: string, limbaj: Limbaj): NivelLivrat {
  const o = obiect(v, unde);
  const exercitii = lista(o.exercitii, `${unde}.exercitii`).map((e, i) =>
    citesteExercitiu(e, `${unde}.exercitii[${i}]`, limbaj),
  );
  unice(
    exercitii.map((e) => e.cheie),
    `${unde}.exercitii`,
  );
  return {
    cheie: cheie(o.cheie, `${unde}.cheie`),
    nume: sir(o.nume, `${unde}.nume`),
    briefing: lista(o.briefing, `${unde}.briefing`).map((e, i) =>
      citesteEcran(e, `${unde}.briefing[${i}]`),
    ),
    exercitii,
    ...(o.test === undefined
      ? {}
      : { test: citesteTest(o.test, `${unde}.test`) }),
  };
}

function citesteCapitol(
  v: unknown,
  unde: string,
  limbaj: Limbaj,
): CapitolLivrat {
  const o = obiect(v, unde);
  const niveluri = lista(o.niveluri, `${unde}.niveluri`).map((n, i) =>
    citesteNivel(n, `${unde}.niveluri[${i}]`, limbaj),
  );
  unice(
    niveluri.map((n) => n.cheie),
    `${unde}.niveluri`,
  );
  return {
    cheie: cheie(o.cheie, `${unde}.cheie`),
    nume: sir(o.nume, `${unde}.nume`),
    niveluri,
    ...(o.test === undefined
      ? {}
      : { test: citesteTest(o.test, `${unde}.test`) }),
  };
}

/** Verifică un curs deja desfăcut din JSON. Aruncă `EroareFormat` la prima greșeală. */
export function citesteCurs(v: unknown): CursLivrat {
  const o = obiect(v, "cursul");

  if (o.format !== FORMAT) {
    throw new EroareFormat(
      "cursul.format",
      `aștept „${FORMAT}", am primit „${String(o.format)}"`,
    );
  }
  if (o.versiune !== VERSIUNE) {
    throw new EroareFormat(
      "cursul.versiune",
      `fișierul e scris în versiunea ${String(o.versiune)}, aplicația citește ${VERSIUNE}`,
    );
  }

  const limbaj = o.limbaj === undefined ? LIMBAJ_IMPLICIT : o.limbaj;
  if (!(LIMBAJE as readonly unknown[]).includes(limbaj)) {
    throw new EroareFormat(
      "cursul.limbaj",
      `„${String(limbaj)}" nu e un motor cunoscut (${LIMBAJE.join(", ")})`,
    );
  }

  const capitole = lista(o.capitole, "cursul.capitole").map((c, i) =>
    citesteCapitol(c, `cursul.capitole[${i}]`, limbaj as Limbaj),
  );
  unice(
    capitole.map((c) => c.cheie),
    "cursul.capitole",
  );

  return {
    format: FORMAT,
    versiune: VERSIUNE,
    materie: sir(o.materie, "cursul.materie"),
    limbaj: limbaj as Limbaj,
    capitole,
  };
}

/** Același lucru, pornind de la textul fișierului. */
export function citesteCursDinText(text: string): CursLivrat {
  let desfacut: unknown;
  try {
    desfacut = JSON.parse(text);
  } catch {
    throw new EroareFormat("cursul", "fișierul nu e JSON valid");
  }
  return citesteCurs(desfacut);
}
