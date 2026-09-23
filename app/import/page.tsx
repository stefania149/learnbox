"use client";

/*
 * Materialul tău — pasul 18. PDF → text pagină cu pagină → bucăți de ~800 de
 * caractere → embeddinguri, calculate în browser. Nimic din asta nu leagă
 * încă bucățile de curs: graful de concepte și generarea vin la pașii 19-20
 * (`PLAN.md` §6).
 *
 * Nu cere WebGPU — embeddingurile merg prin WASM, pe orice browser.
 */

import { useEffect, useRef, useState } from "react";
import {
  Ecran,
  AntetEcran,
  ContinutEcran,
  BaraActiuni,
  Panou,
} from "@/componente/ecran";
import { Buton, ButonLegatura } from "@/componente/buton";
import { mesajEroare } from "@/lib/date/erori";
import { extragePaginile, EroarePdf } from "@/lib/import/pdf";
import { faBucati } from "@/lib/import/bucati";
import {
  calculeazaEmbeddingurile,
  type RaportEmbeddinguri,
} from "@/lib/import/embeddinguri";
import {
  scrieMaterialul,
  listaMaterialelor,
  type MaterialListat,
} from "@/lib/date/material";

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type Import =
  | { fel: "asteapta" }
  | { fel: "citeste-pdf" }
  | { fel: "calculeaza"; raport: RaportEmbeddinguri }
  | { fel: "scrie" }
  | { fel: "gata"; bucati: number }
  | { fel: "eroare"; mesaj: string };

type Lista =
  | { fel: "se-incarca" }
  | { fel: "gata"; materiale: MaterialListat[] }
  | { fel: "eroare"; mesaj: string };

export default function EcranImport() {
  const [import_, setImport] = useState<Import>({ fel: "asteapta" });
  const [lista, setLista] = useState<Lista>({ fel: "se-incarca" });
  const [incarcari, reincarca] = useState(0);
  const alegator = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let anulat = false;
    listaMaterialelor()
      .then((materiale) => !anulat && setLista({ fel: "gata", materiale }))
      .catch(
        (e: unknown) => !anulat && setLista({ fel: "eroare", mesaj: mesajEroare(e) }),
      );
    return () => {
      anulat = true;
    };
  }, [incarcari]);

  async function importaFisierul(fisier: File) {
    setImport({ fel: "citeste-pdf" });
    try {
      const pagini = await extragePaginile(fisier);
      const bucatile = faBucati(pagini);
      if (bucatile.length === 0) {
        throw new Error(
          "N-am găsit text în PDF-ul ăsta. Poate e doar imagini scanate — încă nu știm să citim alea.",
        );
      }

      setImport({ fel: "calculeaza", raport: { facute: 0, total: bucatile.length } });
      const embeddingurile = await calculeazaEmbeddingurile(
        bucatile.map((b) => b.text),
        (raport) => setImport({ fel: "calculeaza", raport }),
      );

      setImport({ fel: "scrie" });
      await scrieMaterialul({
        titlu: fisier.name.replace(/\.pdf$/i, ""),
        fisier: fisier.name,
        bucati: bucatile.map((b, i) => ({ ...b, embedding: embeddingurile[i] })),
      });

      setImport({ fel: "gata", bucati: bucatile.length });
      reincarca((n) => n + 1);
    } catch (e) {
      const mesaj = e instanceof EroarePdf ? e.message : mesajEroare(e);
      setImport({ fel: "eroare", mesaj });
    }
  }

  const seLucreaza =
    import_.fel === "citeste-pdf" ||
    import_.fel === "calculeaza" ||
    import_.fel === "scrie";

  return (
    <Ecran>
      <AntetEcran
        titlu="Materialul tău"
        subtitlu="Un PDF de-al tău, tăiat în bucăți și pregătit pentru mai târziu. Nimic din asta nu pleacă de pe calculatorul tău."
      />
      <ContinutEcran>
        <Panou titlu="Adaugă un PDF">
          <p className="text-text-slab">
            Textul se scoate din PDF, se taie în bucăți de-o pagină și ceva, și
            fiecare bucată primește un rezumat numeric (embedding), calculat
            aici, în browser. Deocamdată doar se strâng — ce se face cu ele
            vine la pașii următori.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={alegator}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                ev.target.value = "";
                if (f) void importaFisierul(f);
              }}
            />
            <Buton
              onClick={() => alegator.current?.click()}
              disabled={seLucreaza}
            >
              Alege un PDF…
            </Buton>
          </div>

          <p aria-live="polite" className="text-sm text-text-slab">
            {import_.fel === "citeste-pdf"
              ? "Se citește PDF-ul…"
              : import_.fel === "calculeaza"
                ? `Se calculează embeddinguri: ${import_.raport.facute} din ${import_.raport.total} bucăți.`
                : import_.fel === "scrie"
                  ? "Se scrie în bază…"
                  : import_.fel === "gata"
                    ? `Gata: ${import_.bucati} bucăți adăugate.`
                    : import_.fel === "eroare"
                      ? "N-a mers."
                      : "Prima dată aduce și modelul de embeddinguri (~25 MB) — o singură dată."}
          </p>
          {import_.fel === "eroare" ? (
            <p className="font-mono text-sm text-text-slab">{import_.mesaj}</p>
          ) : null}
        </Panou>

        <Panou titlu="Ce ai adus până acum">
          {lista.fel === "se-incarca" ? (
            <p className="text-text-slab">Se deschide baza de date locală.</p>
          ) : null}

          {lista.fel === "eroare" ? (
            <>
              <p className="text-text-slab">
                Baza de date din browser n-a răspuns.
              </p>
              <p className="font-mono text-sm text-text-slab">{lista.mesaj}</p>
              <div>
                <Buton fel="secundar" onClick={() => reincarca((n) => n + 1)}>
                  Încearcă din nou
                </Buton>
              </div>
            </>
          ) : null}

          {lista.fel === "gata" && lista.materiale.length === 0 ? (
            <p className="text-text-slab">N-ai adus încă niciun material.</p>
          ) : null}

          {lista.fel === "gata" && lista.materiale.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {lista.materiale.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-col gap-1 rounded-tema border border-contur p-4"
                >
                  <span className="font-medium">{m.titlu}</span>
                  <span className="text-sm text-text-slab">
                    {m.fisier} · {m.bucati}{" "}
                    {m.bucati === 1 ? "bucată" : "bucăți"} · adus la{" "}
                    {CAND.format(m.importatLa)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        <ButonLegatura href="/concepte/" fel="secundar">
          Graful de concepte
        </ButonLegatura>
        <ButonLegatura href="/setari/" fel="secundar">
          Setări
        </ButonLegatura>
        <ButonLegatura href="/" fel="secundar">
          Înapoi
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}
