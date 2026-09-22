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
import type { CazTest } from "@/lib/exercitii/motor";

export const FORMAT = "tutore-curs";
export const VERSIUNE = 1;

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

export type NivelLivrat = {
  cheie: string;
  nume: string;
  briefing: EcranBriefing[];
  exercitii: ExercitiuLivrat[];
};

export type CapitolLivrat = {
  cheie: string;
  nume: string;
  niveluri: NivelLivrat[];
};

export type CursLivrat = {
  format: typeof FORMAT;
  versiune: number;
  /** Numele propriu al cursului, cel de pe ecran: „Python". */
  materie: string;
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

function citesteCaz(v: unknown, unde: string): CazTest {
  const o = obiect(v, unde);
  return {
    apel: sir(o.apel, `${unde}.apel`),
    // `asteptat` poate fi text gol: o funcție care întoarce `""` e un caz bun.
    asteptat: sir(o.asteptat, `${unde}.asteptat`, { gol: true }),
  };
}

function citesteEcran(v: unknown, unde: string): EcranBriefing {
  const o = obiect(v, unde);
  return {
    titlu: sir(o.titlu, `${unde}.titlu`),
    text: sir(o.text, `${unde}.text`),
    ...(o.cod === undefined ? {} : { cod: sir(o.cod, `${unde}.cod`) }),
  };
}

function citesteExercitiu(v: unknown, unde: string): ExercitiuLivrat {
  const o = obiect(v, unde);
  const tip = sir(o.tip, `${unde}.tip`);
  if (!(TIPURI_EXERCITIU as readonly string[]).includes(tip)) {
    throw new EroareFormat(
      `${unde}.tip`,
      `„${tip}" nu e un tip cunoscut (${TIPURI_EXERCITIU.join(", ")})`,
    );
  }
  const cazuri = lista(o.cazuriTest, `${unde}.cazuriTest`).map((c, i) =>
    citesteCaz(c, `${unde}.cazuriTest[${i}]`),
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

function citesteNivel(v: unknown, unde: string): NivelLivrat {
  const o = obiect(v, unde);
  const exercitii = lista(o.exercitii, `${unde}.exercitii`).map((e, i) =>
    citesteExercitiu(e, `${unde}.exercitii[${i}]`),
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
  };
}

function citesteCapitol(v: unknown, unde: string): CapitolLivrat {
  const o = obiect(v, unde);
  const niveluri = lista(o.niveluri, `${unde}.niveluri`).map((n, i) =>
    citesteNivel(n, `${unde}.niveluri[${i}]`),
  );
  unice(
    niveluri.map((n) => n.cheie),
    `${unde}.niveluri`,
  );
  return {
    cheie: cheie(o.cheie, `${unde}.cheie`),
    nume: sir(o.nume, `${unde}.nume`),
    niveluri,
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

  const capitole = lista(o.capitole, "cursul.capitole").map((c, i) =>
    citesteCapitol(c, `cursul.capitole[${i}]`),
  );
  unice(
    capitole.map((c) => c.cheie),
    "cursul.capitole",
  );

  return {
    format: FORMAT,
    versiune: VERSIUNE,
    materie: sir(o.materie, "cursul.materie"),
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
