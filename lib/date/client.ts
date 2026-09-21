/**
 * Accesul la date. PGlite (Postgres în WASM) peste IndexedDB, cu Drizzle
 * deasupra — tot accesul trece pe aici (`CLAUDE.md`, convenții de cod).
 *
 * Baza rulează într-un Web Worker, din fișiere statice: `public/baza.worker.js`
 * și copia PGlite din `public/vendor/pglite/`. Împachetătorul nu atinge PGlite
 * — vezi motivele în `scripts/copiaza-vendor.mjs`.
 */
import type { PGlite } from "@electric-sql/pglite";
import type { PGliteWorker } from "@electric-sql/pglite/worker";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { migrari } from "./migrari-generate";

export type Baza = ReturnType<typeof drizzle<typeof schema>>;
export type ClientBaza = PGliteWorker;

/**
 * Instanța se ține pe `globalThis`, nu într-o variabilă de modul: în
 * dezvoltare modulul se reevaluează la fiecare Fast Refresh, iar un al doilea
 * client ar porni un al doilea worker peste aceeași bază.
 */
const CHEIE = Symbol.for("tutore.baza");

type Deschidere = Promise<{ pg: ClientBaza; baza: Baza }>;
const glob = globalThis as { [CHEIE]?: Deschidere };

/** Calea de bază a sitului; pe GitHub Pages e /<nume-repo>. */
const bazaCale = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Cât așteptăm deschiderea înainte să spunem că n-a mers. Prima deschidere
 * aduce ~10 MB de WASM; peste atât nu mai e „încă puțin", e stricat.
 */
const RABDARE_MS = 30_000;

export function deschideBaza(): Deschidere {
  glob[CHEIE] ??= porneste().catch((e) => {
    // Fără asta, „Încearcă din nou" ar primi la nesfârșit aceeași promisiune
    // respinsă.
    delete glob[CHEIE];
    throw e;
  });
  return glob[CHEIE];
}

async function porneste(): Promise<{ pg: ClientBaza; baza: Baza }> {
  return Promise.race([
    deschideDeAdevarat(),
    new Promise<never>((_, respinge) =>
      setTimeout(
        () =>
          respinge(
            new Error(
              `Baza nu s-a deschis în ${RABDARE_MS / 1000} secunde. Conexiunea poate fi prea lentă pentru cele câteva megabyte ale motorului.`,
            ),
          ),
        RABDARE_MS,
      ),
    ),
  ]);
}

async function deschideDeAdevarat(): Promise<{ pg: ClientBaza; baza: Baza }> {
  // Import la rulare, dintr-o cale pe care împachetătorul n-o poate citi
  // static — altfel ar trage PGlite înapoi în bundle.
  const caleModul = `${bazaCale}/vendor/pglite/worker/index.js`;
  const { PGliteWorker } = (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ caleModul
  )) as typeof import("@electric-sql/pglite/worker");

  const fir = new Worker(`${bazaCale}/baza.worker.js`, {
    type: "module",
    name: "baza-tutore",
  });
  const cazut = new Promise<never>((_, respinge) => {
    fir.onerror = () =>
      respinge(new Error("Firul bazei de date nu a putut porni."));
  });

  const pg = new PGliteWorker(fir);
  await Promise.race([pg.waitReady, cazut]);
  await aplicaMigrari(pg);

  // PGliteWorker respectă aceeași interfață ca PGlite; tipurile lui Drizzle
  // cer clasa concretă.
  return { pg, baza: drizzle(pg as unknown as PGlite, { schema }) };
}

/** Ce migrări sunt deja aplicate, în ordinea aplicării. */
export async function migrariAplicate(pg: ClientBaza) {
  const r = await pg.query<{ nume: string; aplicata_la: Date }>(
    `select nume, aplicata_la from migrare_aplicata order by nume`,
  );
  return r.rows;
}

async function aplicaMigrari(pg: ClientBaza) {
  await pg.exec(`
    create table if not exists migrare_aplicata (
      nume text primary key,
      aplicata_la timestamptz not null default now()
    );
  `);

  const aplicate = new Set((await migrariAplicate(pg)).map((r) => r.nume));

  for (const migrare of migrari) {
    if (aplicate.has(migrare.nume)) continue;

    // Drizzle desparte instrucțiunile cu acest marcaj.
    const instructiuni = migrare.sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    await pg.transaction(async (tx) => {
      for (const instructiune of instructiuni) {
        await tx.exec(instructiune);
      }
      await tx.query(`insert into migrare_aplicata (nume) values ($1)`, [
        migrare.nume,
      ]);
    });
  }
}
