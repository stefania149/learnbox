/**
 * Rularea codului Python, de pe firul principal.
 *
 * Aici nu se execută nimic — se vorbește cu workerul din `public/python.worker.js`.
 * Fiecare rulare are cronometru; la depășire workerul se omoară și repornește,
 * fiindcă un `while True:` nu se poate opri altfel (`PLAN.md` §7).
 */

/** Cât lăsăm codul să ruleze. `PLAN.md` §15, Î-10. */
export const RABDARE_MS = 5_000;

/** Cât așteptăm prima pornire: Pyodide are ~13 MB de adus. */
const PORNIRE_MS = 60_000;

export type LinieIesire = { flux: "stdout" | "stderr"; text: string };

/** Un caz de test terminat, anunțat pe măsură ce motorul avansează. */
export type ProgresCaz = {
  indice: number;
  stare: "trecut" | "picat" | "eroare";
  primit: string;
};

export type Rezultat =
  | { fel: "gata"; iesire: LinieIesire[]; valoare: string | null }
  | { fel: "eroare"; iesire: LinieIesire[]; eroare: string }
  | { fel: "timp-expirat"; iesire: LinieIesire[]; secunde: number };

export type Optiuni = {
  rabdareMs?: number;
  /** Chemat pentru fiecare caz de test terminat, înainte de rezultatul final. */
  laProgres?: (caz: ProgresCaz) => void;
};

const caleBaza = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Asteptare = {
  rezolva: (r: Rezultat) => void;
  laProgres?: (caz: ProgresCaz) => void;
};

/**
 * Un singur worker, repornit când se blochează. Se ține pe `globalThis` ca
 * Fast Refresh să nu lase fire orfane în dezvoltare.
 */
export class Python {
  #fir: Worker | null = null;
  #pornire: Promise<void> | null = null;
  #inAsteptare = new Map<number, Asteptare>();
  #urmatorulId = 1;
  #iesireCurenta: LinieIesire[] = [];

  /** Se cheamă din interfață ca să arate „se pregătește" înainte de prima rulare. */
  async pregateste(): Promise<void> {
    this.#pornire ??= this.#porneste();
    return this.#pornire;
  }

  async #porneste(): Promise<void> {
    const fir = new Worker(`${caleBaza}/python.worker.js`, {
      type: "module",
      name: "python-tutore",
    });
    this.#fir = fir;

    await new Promise<void>((rezolva, respinge) => {
      const cronometru = setTimeout(
        () =>
          respinge(
            new Error(
              `Python nu a pornit în ${PORNIRE_MS / 1000} de secunde. Se aduc ~13 MB la prima pornire.`,
            ),
          ),
        PORNIRE_MS,
      );

      fir.onmessage = (ev) => {
        if (ev.data?.tip === "pornit") {
          clearTimeout(cronometru);
          fir.onmessage = (e) => this.#primeste(e);
          rezolva();
        }
      };
      fir.onerror = () => {
        clearTimeout(cronometru);
        respinge(new Error("Firul Python nu a putut porni."));
      };
    }).catch((e) => {
      this.#opreste();
      throw e;
    });
  }

  #primeste(ev: MessageEvent) {
    const { id, tip, iesire, valoare, eroare, caz } = ev.data;
    const asteptare = this.#inAsteptare.get(id);
    if (!asteptare) return;

    if (tip === "progres") {
      asteptare.laProgres?.(caz);
      return;
    }

    this.#inAsteptare.delete(id);
    asteptare.rezolva(
      tip === "eroare"
        ? { fel: "eroare", iesire, eroare }
        : { fel: "gata", iesire, valoare },
    );
  }

  /** Omoară firul. Tot ce aștepta rămâne în seama apelantului. */
  #opreste() {
    this.#fir?.terminate();
    this.#fir = null;
    this.#pornire = null;
    this.#inAsteptare.clear();
  }

  async ruleaza(cod: string, optiuni: Optiuni = {}): Promise<Rezultat> {
    const rabdareMs = optiuni.rabdareMs ?? RABDARE_MS;
    await this.pregateste();

    const id = this.#urmatorulId++;
    this.#iesireCurenta = [];

    const raspuns = new Promise<Rezultat>((rezolva) => {
      this.#inAsteptare.set(id, { rezolva, laProgres: optiuni.laProgres });
      this.#fir?.postMessage({ id, cod });
    });

    const expirare = new Promise<Rezultat>((rezolva) =>
      setTimeout(
        () =>
          rezolva({
            fel: "timp-expirat",
            iesire: this.#iesireCurenta,
            secunde: rabdareMs / 1000,
          }),
        rabdareMs,
      ),
    );

    const rezultat = await Promise.race([raspuns, expirare]);

    if (rezultat.fel === "timp-expirat") {
      // Singura cale de oprire a unei bucle infinite.
      this.#opreste();
      // Repornim în fundal, ca următoarea rulare să nu aștepte de la zero.
      void this.pregateste().catch(() => {});
    }

    return rezultat;
  }
}

const CHEIE = Symbol.for("tutore.python");
const glob = globalThis as { [CHEIE]?: Python };

export function python(): Python {
  glob[CHEIE] ??= new Python();
  return glob[CHEIE];
}
