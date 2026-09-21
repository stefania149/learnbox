"use client";

import { useReducer, useSyncExternalStore } from "react";
import { Ecran, AntetEcran, ContinutEcran, BaraActiuni, Panou } from "@/componente/ecran";
import { Buton, ButonLegatura } from "@/componente/buton";

type Verificare = { nume: string; explicatie: string; prezent: boolean };

/** Tot ce se verifică aici e cerut de pașii care urmează: date, worker, WASM. */
function verifica(): Verificare[] {
  return [
    {
      nume: "IndexedDB",
      explicatie: "Aici se păstrează progresul tău, pe calculatorul acesta.",
      prezent: typeof indexedDB !== "undefined",
    },
    {
      nume: "Web Workers",
      explicatie: "Codul pe care-l scrii rulează separat de interfață.",
      prezent: typeof Worker !== "undefined",
    },
    {
      nume: "WebAssembly",
      explicatie: "Python și baza de date rulează prin el, în browser.",
      prezent: typeof WebAssembly !== "undefined",
    },
    {
      nume: "Service Worker",
      explicatie: "Cu el, aplicația se instalează și pornește offline.",
      prezent: typeof navigator !== "undefined" && "serviceWorker" in navigator,
    },
  ];
}

const versiune = process.env.NEXT_PUBLIC_VERSIUNE ?? "local";

/** Verificările au sens doar în browser; la prerandare nu există navigator. */
function useEsteInBrowser() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function Stare() {
  const inBrowser = useEsteInBrowser();
  // Butonul doar cere o randare nouă; verificarea se reface atunci.
  const [, reverifica] = useReducer((n: number) => n + 1, 0);
  const verificari = inBrowser ? verifica() : null;

  return (
    <Ecran>
      <AntetEcran
        titlu="Starea browserului"
        subtitlu="Ce are browserul tău din ce folosește aplicația."
      />
      <ContinutEcran>
        <Panou titlu="Verificări">
          {verificari === null ? (
            <p className="text-text-slab">Se verifică…</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {verificari.map((v) => (
                <li key={v.nume} className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 font-medium">
                    <span aria-hidden="true">{v.prezent ? "●" : "○"}</span>
                    {v.nume}
                    <span className="text-sm font-normal text-text-slab">
                      {v.prezent ? "disponibil" : "indisponibil"}
                    </span>
                  </span>
                  <span className="text-sm text-text-slab">{v.explicatie}</span>
                </li>
              ))}
            </ul>
          )}
        </Panou>
        <Panou titlu="Versiune">
          <p className="font-mono text-sm text-text-slab">{versiune}</p>
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        <Buton onClick={reverifica}>Verifică din nou</Buton>
        <ButonLegatura href="/" fel="secundar">
          Înapoi
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}
