/**
 * Rularea SQL-ului scris de utilizator, de pe firul principal.
 *
 * Aici nu se execută nimic — se vorbește cu workerul din `public/sql.worker.js`,
 * care ține un Postgres gol, în memorie, separat de baza cu progresul.
 * Cronometrul stă aici, fiindcă o interogare care nu se termină nu se poate
 * opri din interiorul firului (`PLAN.md` §7).
 *
 * E aproape geamănul lui `lib/python/client.ts`: aceeași pornire, același
 * cronometru, aceeași repornire. Diferă ce se trimite (cazurile, nu un
 * program) și cât se așteaptă la pornire.
 */
import type { LinieIesire, ProgresCaz, Rezultat } from "@/lib/python/client";

/** Cât lăsăm o interogare să meargă. Aceeași răbdare ca la Python (Î-10). */
export const RABDARE_SQL_MS = 5_000;

/** Cât așteptăm prima pornire: Postgresul în WASM are ~3 MB de adus. */
const PORNIRE_MS = 30_000;

/** Un caz de SQL: datele pe care se rulează, și ce trebuie să iasă. */
export type CazSql = {
  /** Instrucțiunile care fac tabelele și le umplu, înaintea codului. */
  pregatire?: string;
  /** Interogarea care verifică, când exercițiul cere `INSERT`/`UPDATE`. */
  verificare?: string;
  asteptat: string;
};

export type OptiuniSql = {
  rabdareMs?: number;
  laProgres?: (caz: ProgresCaz) => void;
};

const caleBaza = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Asteptare = {
  rezolva: (r: Rezultat) => void;
  laProgres?: (caz: ProgresCaz) => void;
};

export class Sql {
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
    const fir = new Worker(`${caleBaza}/sql.worker.js`, {
      type: "module",
      name: "sql-tutore",
    });
    this.#fir = fir;

    await new Promise<void>((rezolva, respinge) => {
      const cronometru = setTimeout(
        () =>
          respinge(
            new Error(
              `Postgres nu a pornit în ${PORNIRE_MS / 1000} de secunde. Se aduc ~3 MB la prima pornire.`,
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
        respinge(new Error("Firul cu Postgres nu a putut porni."));
      };
    }).catch((e) => {
      this.#opreste();
      throw e;
    });
  }

  #primeste(ev: MessageEvent) {
    const { id, tip, iesire, eroare, caz } = ev.data;
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
        : { fel: "gata", iesire, valoare: null },
    );
  }

  /** Omoară firul. Baza din el era în memorie, deci nu rămâne nimic în urmă. */
  #opreste() {
    this.#fir?.terminate();
    this.#fir = null;
    this.#pornire = null;
    this.#inAsteptare.clear();
  }

  async ruleaza(
    cod: string,
    cazuri: CazSql[],
    optiuni: OptiuniSql = {},
  ): Promise<Rezultat> {
    const rabdareMs = optiuni.rabdareMs ?? RABDARE_SQL_MS;
    await this.pregateste();

    const id = this.#urmatorulId++;
    this.#iesireCurenta = [];

    const raspuns = new Promise<Rezultat>((rezolva) => {
      this.#inAsteptare.set(id, { rezolva, laProgres: optiuni.laProgres });
      this.#fir?.postMessage({ id, cod, cazuri });
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
      this.#opreste();
      void this.pregateste().catch(() => {});
    }

    return rezultat;
  }
}

const CHEIE = Symbol.for("tutore.sql");
const glob = globalThis as { [CHEIE]?: Sql };

export function sql(): Sql {
  glob[CHEIE] ??= new Sql();
  return glob[CHEIE];
}
