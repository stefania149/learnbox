"use client";

/*
 * Graful de concepte — pasul 19. Fiecare bucată de material trece prin
 * model, care scoate conceptele ei și de ce alte concepte depinde fiecare.
 * Un concept cerut ca dependență dar neacoperit de material e o lacună:
 * modelul o scrie singur, marcată vizibil (`PLAN.md` §6).
 *
 * Cere modelul — descărcarea nu pornește niciodată fără un clic explicit
 * (regula 5), la fel ca la pasul 16.
 */

import { useEffect, useState } from "react";
import {
  Ecran,
  AntetEcran,
  ContinutEcran,
  BaraActiuni,
  Panou,
} from "@/componente/ecran";
import { Buton, ButonLegatura } from "@/componente/buton";
import { mesajEroare } from "@/lib/date/erori";
import {
  descarcaModelul,
  MARIME_APROX_MB,
  motorPornit,
  suportaModelul,
  type RaportProgres,
} from "@/lib/rutare-model";
import {
  bucatiDeProcesat,
  citesteGraful,
  construiesteGraful,
  type ConceptCitit,
  type RaportGraf,
} from "@/lib/import/concepte";

type StareModel =
  | { fel: "verifica" }
  | { fel: "nesuportat" }
  | { fel: "neinceput" }
  | { fel: "se-descarca"; raport: RaportProgres }
  | { fel: "gata" }
  | { fel: "eroare"; mesaj: string };

type StareGraf =
  | { fel: "asteapta"; deProcesat: number }
  | { fel: "lucreaza"; raport: RaportGraf }
  | { fel: "gata"; conceptelNoi: number; lacune: number }
  | { fel: "eroare"; mesaj: string };

type Lista =
  | { fel: "se-incarca" }
  | { fel: "gata"; concepte: ConceptCitit[] }
  | { fel: "eroare"; mesaj: string };

export default function EcranConcepte() {
  const [model, setModel] = useState<StareModel>({ fel: "verifica" });
  const [graf, setGraf] = useState<StareGraf>({ fel: "asteapta", deProcesat: 0 });
  const [lista, setLista] = useState<Lista>({ fel: "se-incarca" });
  const [incarcari, reincarca] = useState(0);

  useEffect(() => {
    let anulat = false;
    (async () => {
      const pornit = motorPornit();
      if (pornit) {
        await pornit.catch(() => {});
        if (!anulat) setModel({ fel: "gata" });
      } else if (!(await suportaModelul())) {
        if (!anulat) setModel({ fel: "nesuportat" });
      } else if (!anulat) {
        setModel({ fel: "neinceput" });
      }
    })();
    return () => {
      anulat = true;
    };
  }, []);

  useEffect(() => {
    let anulat = false;
    (async () => {
      const [concepte, deProcesat] = await Promise.all([
        citesteGraful(),
        bucatiDeProcesat(),
      ]);
      if (anulat) return;
      setLista({ fel: "gata", concepte });
      setGraf((v) => (v.fel === "asteapta" ? { fel: "asteapta", deProcesat } : v));
    })().catch((e: unknown) => {
      if (!anulat) setLista({ fel: "eroare", mesaj: mesajEroare(e) });
    });
    return () => {
      anulat = true;
    };
  }, [incarcari]);

  async function descarcaSiConstruieste() {
    setModel({ fel: "se-descarca", raport: { text: "Se pregătește…", progres: 0 } });
    try {
      await descarcaModelul((raport) => setModel({ fel: "se-descarca", raport }));
      setModel({ fel: "gata" });
      await construieste();
    } catch (e) {
      setModel({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  async function construieste() {
    setGraf({ fel: "lucreaza", raport: { faza: "concepte", facute: 0, total: 1 } });
    try {
      const { conceptelNoi, lacune } = await construiesteGraful((raport) =>
        setGraf({ fel: "lucreaza", raport }),
      );
      setGraf({ fel: "gata", conceptelNoi, lacune });
      reincarca((n) => n + 1);
    } catch (e) {
      setGraf({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  return (
    <Ecran>
      <AntetEcran
        titlu="Graful de concepte"
        subtitlu="Din bucățile aduse la „Materialul tău”, modelul scoate conceptele și legăturile dintre ele. Ce lipsește din material, dar e cerut ca dependență, apare marcat — scris de model, nu din ce ai adus."
      />
      <ContinutEcran>
        {model.fel === "verifica" ? (
          <Panou>
            <p className="text-text-slab">Se verifică dacă browserul poate rula un model.</p>
          </Panou>
        ) : null}

        {model.fel === "nesuportat" ? (
          <Panou titlu="Are nevoie de model">
            <p className="text-text-slab">
              Browserul ăsta n-are WebGPU, deci graful de concepte nu se poate
              construi aici. Restul jocului merge la fel.
            </p>
          </Panou>
        ) : null}

        {model.fel === "neinceput" || model.fel === "se-descarca" || model.fel === "eroare" ? (
          <Panou titlu="Are nevoie de model">
            <p className="text-text-slab">
              Construirea grafului cere modelul din browser (~{MARIME_APROX_MB} MB,
              o singură dată).
            </p>
            {model.fel === "neinceput" ? (
              <div>
                <Buton onClick={() => void descarcaSiConstruieste()}>
                  Descarcă modelul și construiește
                </Buton>
              </div>
            ) : null}
            {model.fel === "se-descarca" ? (
              <>
                <div
                  role="progressbar"
                  aria-valuenow={Math.round(model.raport.progres * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 w-full overflow-hidden rounded-full bg-fundal"
                >
                  <div
                    className="h-full bg-accent transition-[width]"
                    style={{ width: `${Math.round(model.raport.progres * 100)}%` }}
                  />
                </div>
                <p aria-live="polite" className="text-sm text-text-slab">
                  {model.raport.text || "Se descarcă…"}
                </p>
              </>
            ) : null}
            {model.fel === "eroare" ? (
              <>
                <p className="font-mono text-sm text-text-slab">{model.mesaj}</p>
                <div>
                  <Buton fel="secundar" onClick={() => void descarcaSiConstruieste()}>
                    Încearcă din nou
                  </Buton>
                </div>
              </>
            ) : null}
          </Panou>
        ) : null}

        {model.fel === "gata" ? (
          <Panou titlu="Construiește">
            {graf.fel === "asteapta" ? (
              <>
                <p className="text-text-slab">
                  {graf.deProcesat === 0
                    ? "Toate bucățile aduse au trecut deja prin model."
                    : `${graf.deProcesat} ${graf.deProcesat === 1 ? "bucată" : "bucăți"} încă n-au trecut prin model.`}
                </p>
                <div>
                  <Buton onClick={() => void construieste()} disabled={graf.deProcesat === 0}>
                    Construiește graful
                  </Buton>
                </div>
              </>
            ) : null}

            {graf.fel === "lucreaza" ? (
              <p aria-live="polite" className="text-sm text-text-slab">
                {graf.raport.faza === "concepte"
                  ? `Se scot conceptele: ${graf.raport.facute} din ${graf.raport.total} bucăți.`
                  : `Se completează lacunele: ${graf.raport.facute} din ${graf.raport.total}.`}
              </p>
            ) : null}

            {graf.fel === "gata" ? (
              <p className="text-text-slab">
                {graf.conceptelNoi} concepte noi
                {graf.lacune > 0
                  ? `, din care ${graf.lacune} completate de model (lacune).`
                  : "."}
              </p>
            ) : null}

            {graf.fel === "eroare" ? (
              <>
                <p className="text-text-slab">N-a mers.</p>
                <p className="font-mono text-sm text-text-slab">{graf.mesaj}</p>
              </>
            ) : null}
          </Panou>
        ) : null}

        <Panou titlu="Ce are graful până acum">
          {lista.fel === "se-incarca" ? (
            <p className="text-text-slab">Se deschide baza de date locală.</p>
          ) : null}

          {lista.fel === "eroare" ? (
            <p className="font-mono text-sm text-text-slab">{lista.mesaj}</p>
          ) : null}

          {lista.fel === "gata" && lista.concepte.length === 0 ? (
            <p className="text-text-slab">
              Niciun concept încă — adu întâi un material și construiește graful.
            </p>
          ) : null}

          {lista.fel === "gata" && lista.concepte.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {lista.concepte.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-1 rounded-tema border border-contur p-4"
                >
                  <span className="font-medium">{c.nume}</span>
                  {c.provenienta === "model" ? (
                    <span className="text-sm text-accent">
                      ⚠️ completat de mine — profesorul n-a acoperit asta
                    </span>
                  ) : null}
                  {c.descriere ? (
                    <span className="text-sm text-text-slab">{c.descriere}</span>
                  ) : null}
                  {c.dependeDe.length > 0 ? (
                    <span className="text-sm text-text-slab">
                      Depinde de: {c.dependeDe.join(", ")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        <ButonLegatura href="/genereaza/">Generează cursul</ButonLegatura>
        <ButonLegatura href="/import/" fel="secundar">
          Materialul tău
        </ButonLegatura>
        <ButonLegatura href="/" fel="secundar">
          Înapoi
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}
