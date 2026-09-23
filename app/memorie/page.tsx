"use client";

/*
 * Ecranul de memorie — pasul 22 (`PLAN.md` §9: „vizibilă și editabilă",
 * `CLAUDE.md` regula 10). Tot ce a reținut asistentul, rând cu rând, cu
 * buton de șters pe fiecare — ce nu poți vedea nu poți corecta.
 *
 * Nu cere modelul: memoria e doar citire și scriere în bază, ca orice alt
 * ecran de progres (regula 5 nu se pune aici, merge oricum).
 */

import { useEffect, useState } from "react";
import { Ecran, AntetEcran, ContinutEcran, BaraActiuni, Panou } from "@/componente/ecran";
import { Buton, ButonLegatura } from "@/componente/buton";
import { mesajEroare } from "@/lib/date/erori";
import { faptele, stergeFaptul, type Fapt } from "@/lib/date/asistent";
import { ETICHETA_TIP, type TipFapt } from "@/lib/asistent/extrage";

type Lista =
  | { fel: "se-incarca" }
  | { fel: "gata"; fapte: Fapt[] }
  | { fel: "eroare"; mesaj: string };

function eticheta(tip: string): string {
  return ETICHETA_TIP[tip as TipFapt] ?? tip;
}

export default function EcranMemorie() {
  const [lista, setLista] = useState<Lista>({ fel: "se-incarca" });
  const [seSterge, setSeSterge] = useState<number | null>(null);

  useEffect(() => {
    let anulat = false;
    faptele()
      .then((f) => !anulat && setLista({ fel: "gata", fapte: f }))
      .catch((e: unknown) => !anulat && setLista({ fel: "eroare", mesaj: mesajEroare(e) }));
    return () => {
      anulat = true;
    };
  }, []);

  async function sterge(id: number) {
    setSeSterge(id);
    try {
      await stergeFaptul(id);
      setLista((v) => (v.fel === "gata" ? { fel: "gata", fapte: v.fapte.filter((f) => f.id !== id) } : v));
    } catch (e) {
      setLista({ fel: "eroare", mesaj: mesajEroare(e) });
    } finally {
      setSeSterge(null);
    }
  }

  return (
    <Ecran>
      <AntetEcran
        titlu="Memorie"
        subtitlu="Tot ce a reținut asistentul din conversații — despre studiu, nu despre tine. Poți șterge orice rând."
      />
      <ContinutEcran>
        <Panou titlu="Ce s-a reținut">
          {lista.fel === "se-incarca" ? (
            <p className="text-text-slab">Se deschide baza de date locală.</p>
          ) : null}

          {lista.fel === "eroare" ? (
            <p className="font-mono text-sm text-text-slab">{lista.mesaj}</p>
          ) : null}

          {lista.fel === "gata" && lista.fapte.length === 0 ? (
            <p className="text-text-slab">
              Nimic încă. Vorbește cu asistentul — ce spui despre studiu apare aici.
            </p>
          ) : null}

          {lista.fel === "gata" && lista.fapte.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {lista.fapte.map((f) => (
                <li
                  key={f.id}
                  className="flex items-start justify-between gap-3 rounded-tema border border-contur p-4"
                >
                  <span className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
                      {eticheta(f.tip)}
                    </span>
                    <span className="text-sm">{f.continut}</span>
                  </span>
                  <Buton
                    fel="secundar"
                    onClick={() => void sterge(f.id)}
                    disabled={seSterge === f.id}
                  >
                    {seSterge === f.id ? "Se șterge…" : "Șterge"}
                  </Buton>
                </li>
              ))}
            </ul>
          ) : null}
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        <ButonLegatura href="/asistent/" fel="secundar">
          Asistent
        </ButonLegatura>
        <ButonLegatura href="/" fel="secundar">
          Înapoi
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}
