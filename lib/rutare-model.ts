/// <reference types="@webgpu/types" />

/**
 * Singurul fișier care decide dacă există model (`CLAUDE.md`, convenții de
 * cod). Nicio altă bucată de cod nu întreabă „avem WebGPU?" — cheamă funcțiile
 * de-aici. Pasul 16 din `PLAN.md` §13.
 *
 * WebLLM rulează într-un Web Worker (`./rutare-model.worker.ts`), din același
 * motiv ca Pyodide (`PLAN.md` §7): un model care ar rula pe firul principal ar
 * bloca interfața la fiecare răspuns.
 *
 * **Nu trece prin Turbopack.** Ca PGlite (`lib/date/client.ts`): pachetul e
 * prea mare pentru coajă și `new Worker(new URL(...))` iese din build ca sursă
 * neatinsă, nu ca fir adevărat. `scripts/fa-model-worker.mjs` îl împachetează
 * dinainte, în `public/vendor/web-llm/`, iar aici se aduce cu o adresă, nu cu
 * un import — la fel ca PGlite.
 *
 * **Descărcarea nu pornește niciodată singură.** `descarcaModelul` se cheamă
 * doar dintr-un clic al utilizatorului. Fără ea, restul jocului merge la fel —
 * regula 5 (`CLAUDE.md`), principiul 10 (`PLAN.md` §9).
 */
import type { MLCEngineInterface, InitProgressReport } from "@mlc-ai/web-llm";

const caleBaza = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Modulul WebLLM, adus static, nu prin bundler — vezi nota de sus. */
function modulWebLlm(): Promise<typeof import("@mlc-ai/web-llm")> {
  const cale = `${caleBaza}/vendor/web-llm/index.js`;
  return import(/* webpackIgnore: true */ /* turbopackIgnore: true */ cale);
}

/** ~1B parametri, cuantizat — sub pragul de o descărcare uriașă (`PLAN.md` §4). */
export const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
export const MARIME_APROX_MB = 880;

export type RaportProgres = { text: string; progres: number };

/**
 * Există WebGPU pe calculatorul ăsta? Fals și în afara browserului (randare la
 * build), și când `navigator.gpu` există dar n-are niciun adaptor — ambele ies
 * în aceeași degradare.
 */
export async function suportaModelul(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return false;
  try {
    const adaptor = await navigator.gpu?.requestAdapter();
    return adaptor !== null && adaptor !== undefined;
  } catch {
    return false;
  }
}

/** Dacă modelul stă deja în cache-ul browserului, dintr-o descărcare anterioară. */
export async function modelInCache(): Promise<boolean> {
  const { hasModelInCache } = await modulWebLlm();
  return hasModelInCache(MODEL_ID);
}

const CHEIE = Symbol.for("tutore.model");
type Pornire = Promise<MLCEngineInterface>;
const glob = globalThis as { [CHEIE]?: Pornire };

/**
 * Descarcă (sau aduce din cache) și pornește motorul. Nu se cheamă singură —
 * ecranul o cheamă doar la clicul utilizatorului. A doua chemare, din orice
 * ecran, primește aceeași pornire — nu se descarcă de două ori.
 */
export function descarcaModelul(onProgres?: (r: RaportProgres) => void): Pornire {
  glob[CHEIE] ??= porneste(onProgres).catch((e: unknown) => {
    delete glob[CHEIE];
    throw e;
  });
  return glob[CHEIE];
}

/** Motorul, dacă a fost pornit deja în sesiunea asta. Nu pornește unul nou. */
export function motorPornit(): Pornire | null {
  return glob[CHEIE] ?? null;
}

const CHEIE_COADA = Symbol.for("tutore.model.coada");
const globCoada = globalThis as { [CHEIE_COADA]?: Promise<unknown> };

/**
 * Motorul e o singură resursă, împărțită de tot ce cere ceva de la model —
 * chatul și extragerea de fapte în fundal (pasul 21), graful de concepte,
 * generarea cursului. Două cereri lăsate să plece deodată pe același motor
 * pot să-l strice: găsit la testare, un chat trimis cât extragerea din
 * schimbul anterior încă rula a dat `ModelNotLoadedError` la a treia
 * întrebare. Toate cererile trec printr-o coadă unică, deci a doua așteaptă
 * întâi rezultatul primei, chiar dacă a pornit „în fundal".
 */
export function ruleazaPeModel<T>(sarcina: () => Promise<T>): Promise<T> {
  const dupaCoada = (globCoada[CHEIE_COADA] ?? Promise.resolve()).catch(() => {});
  const rezultat = dupaCoada.then(sarcina);
  globCoada[CHEIE_COADA] = rezultat.catch(() => {});
  return rezultat;
}

async function porneste(
  onProgres?: (r: RaportProgres) => void,
): Promise<MLCEngineInterface> {
  const { CreateWebWorkerMLCEngine } = await modulWebLlm();

  const fir = new Worker(`${caleBaza}/vendor/web-llm/worker.js`, {
    type: "module",
    name: "model-tutore",
  });

  return CreateWebWorkerMLCEngine(fir, MODEL_ID, {
    initProgressCallback: (r: InitProgressReport) =>
      onProgres?.({ text: r.text, progres: r.progress }),
  });
}
