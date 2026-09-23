/**
 * Calculul embeddingurilor, de pe firul principal — pasul 18. Aici nu se
 * calculează nimic, se vorbește cu firul din `embeddinguri.worker.ts`.
 *
 * Ca WebLLM (`lib/rutare-model.ts`), pachetul nu trece prin Turbopack: e prea
 * mare și `new Worker(new URL(...))` iese din build ca sursă neatinsă.
 * `scripts/fa-embeddinguri-worker.mjs` îl împachetează cu esbuild în
 * `public/vendor/embeddinguri/`, în afara coajei.
 *
 * Spre deosebire de asistent, nu cere WebGPU — rulează pe orice browser, deci
 * nu trece prin `lib/rutare-model.ts`.
 */

/** `Xenova/all-MiniLM-L6-v2` — 384 de numere pe embedding. */
export const DIMENSIUNE_EMBEDDING = 384;

export type RaportEmbeddinguri = { facute: number; total: number };

const caleBaza = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
let urmatorulId = 1;

/** Calculează embeddingul fiecărui text, în ordine. Un fir nou pe apel. */
export function calculeazaEmbeddingurile(
  texte: string[],
  onProgres?: (r: RaportEmbeddinguri) => void,
): Promise<number[][]> {
  return new Promise((rezolva, respinge) => {
    const fir = new Worker(`${caleBaza}/vendor/embeddinguri/worker.js`, {
      type: "module",
      name: "embeddinguri-tutore",
    });
    const id = urmatorulId++;

    fir.onmessage = (ev) => {
      const date = ev.data as
        | { id: number; tip: "progres"; facute: number }
        | { id: number; tip: "gata"; embeddinguri: number[][] }
        | { id: number; tip: "eroare"; eroare: string };
      if (date.id !== id) return;

      if (date.tip === "progres") {
        onProgres?.({ facute: date.facute, total: texte.length });
        return;
      }
      fir.terminate();
      if (date.tip === "eroare") respinge(new Error(date.eroare));
      else rezolva(date.embeddinguri);
    };
    fir.onerror = () => {
      fir.terminate();
      respinge(new Error("Firul de embeddinguri nu a putut porni."));
    };

    fir.postMessage({ id, texte });
  });
}
