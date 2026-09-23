/**
 * Extragerea textului dintr-un PDF, pagină cu pagină — pasul 18.
 *
 * Ca PGlite (`lib/date/client.ts`): pachetul e prea mare pentru coajă, deci nu
 * intră prin Turbopack. `scripts/copiaza-vendor.mjs` copiază build-ul deja
 * minificat al `pdf.js` în `public/vendor/pdfjs/`, iar aici se aduce cu o
 * adresă, nu cu un import. Firul lui de parsare vine din același loc.
 */
import type { PaginaText } from "./bucati";

const caleBaza = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Greșeală la citirea PDF-ului, cu locul ei scris în românește. */
export class EroarePdf extends Error {}

function modulPdfjs(): Promise<typeof import("pdfjs-dist")> {
  const cale = `${caleBaza}/vendor/pdfjs/pdf.min.mjs`;
  return import(/* webpackIgnore: true */ /* turbopackIgnore: true */ cale);
}

export async function extragePaginile(fisier: File): Promise<PaginaText[]> {
  const pdfjs = await modulPdfjs();
  pdfjs.GlobalWorkerOptions.workerSrc = `${caleBaza}/vendor/pdfjs/pdf.worker.min.mjs`;

  const octeti = await fisier.arrayBuffer();
  const sarcina = pdfjs.getDocument({ data: octeti });
  const document = await sarcina.promise.catch(() => {
    throw new EroarePdf(
      "Fișierul nu s-a putut citi ca PDF. Verifică dacă chiar e un PDF, nu doar numit așa.",
    );
  });

  const pagini: PaginaText[] = [];
  for (let i = 1; i <= document.numPages; i++) {
    const pagina = await document.getPage(i);
    const continut = await pagina.getTextContent();
    const text = continut.items
      .map((el) => ("str" in el ? el.str : ""))
      .join(" ");
    pagini.push({ pagina: i, text });
  }

  await sarcina.destroy();
  return pagini;
}
