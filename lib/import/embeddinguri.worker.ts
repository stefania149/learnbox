/**
 * Firul care calculează embeddingurile. Rulează `@huggingface/transformers`
 * (WASM, nu WebGPU — merge pe orice browser, spre deosebire de asistentul din
 * `lib/rutare-model.ts`). Nu decide nimic — doar calculează.
 */
import { pipeline, env, type FeatureExtractionPipeline } from "@huggingface/transformers";

env.allowLocalModels = false;

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

let extractorul: Promise<FeatureExtractionPipeline> | null = null;
function iaExtractorul() {
  extractorul ??= pipeline("feature-extraction", MODEL_ID);
  return extractorul;
}

self.onmessage = async (ev: MessageEvent) => {
  const { id, texte } = ev.data as { id: number; texte: string[] };
  try {
    const model = await iaExtractorul();
    const embeddinguri: number[][] = [];
    for (const text of texte) {
      const iesire = await model(text, { pooling: "mean", normalize: true });
      embeddinguri.push(Array.from(iesire.data as Float32Array));
      postMessage({ id, tip: "progres", facute: embeddinguri.length });
    }
    postMessage({ id, tip: "gata", embeddinguri });
  } catch (e) {
    postMessage({
      id,
      tip: "eroare",
      eroare: e instanceof Error ? e.message : String(e),
    });
  }
};
