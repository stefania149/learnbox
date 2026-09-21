"use client";

import { useEffect, useReducer, useState, useSyncExternalStore } from "react";
import { Ecran, AntetEcran, ContinutEcran, BaraActiuni, Panou } from "@/componente/ecran";
import { Buton, ButonLegatura } from "@/componente/buton";
import { mesajEroare } from "@/lib/date/erori";
import {
  citesteDiagnostic,
  type DiagnosticDate,
} from "@/lib/date/diagnostic";

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

type StareDate =
  | { fel: "se-incarca" }
  | { fel: "gata"; diagnostic: DiagnosticDate }
  | { fel: "eroare"; mesaj: string };

export default function Stare() {
  const inBrowser = useEsteInBrowser();
  const [stareDate, setStareDate] = useState<StareDate>({ fel: "se-incarca" });
  const [incarcari, reincarcaDate] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!inBrowser) return;
    let anulat = false;
    citesteDiagnostic()
      .then((diagnostic) => !anulat && setStareDate({ fel: "gata", diagnostic }))
      .catch(
        (e: unknown) =>
          !anulat &&
          setStareDate({
            fel: "eroare",
            mesaj: mesajEroare(e),
          }),
      );
    return () => {
      anulat = true;
    };
  }, [inBrowser, incarcari]);
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
        <Panou titlu="Baza de date locală">
          {stareDate.fel === "se-incarca" ? (
            <p className="text-text-slab">
              Se deschide baza. Prima deschidere aduce motorul Postgres în
              browser și durează câteva secunde.
            </p>
          ) : null}

          {stareDate.fel === "eroare" ? (
            <>
              <p className="text-text-slab">
                Baza n-a pornit. De obicei e una din două: fereastră privată ori
                date blocate pentru acest site, sau motorul (câteva megabyte)
                n-a apucat să se descarce. Restul aplicației merge; progresul
                n-ar avea unde să se păstreze.
              </p>
              <p className="font-mono text-sm text-text-slab">
                {stareDate.mesaj}
              </p>
              <div>
                <Buton
                  fel="secundar"
                  onClick={() => {
                    setStareDate({ fel: "se-incarca" });
                    reincarcaDate();
                  }}
                >
                  Încearcă din nou
                </Buton>
              </div>
            </>
          ) : null}

          {stareDate.fel === "gata" ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Migrări aplicate</span>
                <ul className="flex flex-col gap-1">
                  {stareDate.diagnostic.migrari.map((m) => (
                    <li key={m.nume} className="font-mono text-sm text-text-slab">
                      {m.nume}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">
                  Tabele ({stareDate.diagnostic.tabele.length})
                </span>
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {stareDate.diagnostic.tabele.map((t) => (
                    <li key={t.nume} className="font-mono text-sm text-text-slab">
                      {t.nume}
                      <span className="ml-1 not-italic">· {t.randuri}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </Panou>
        <Panou titlu="Versiune">
          <p className="font-mono text-sm text-text-slab">{versiune}</p>
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        <Buton onClick={reverifica}>Verifică din nou</Buton>
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
