"use client";

/*
 * Cursul propriu — pasul 20. Graful de concepte (pasul 19) se așază
 * topologic și fiecare concept devine o lecție: briefing + un exercițiu
 * verificat prin rulare reală, nu prin ce spune modelul (principiul 1).
 *
 * Incrementală: planul (titlurile, în ordine) se vede imediat, fără model.
 * Reluabilă: lecțiile deja gata se sar la o generare următoare.
 *
 * Durează — un model mic scrie încet (`PLAN.md` §6). Nu ascundem asta după o
 * bară de progres falsă: se poate închide fila și relua oricând.
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
  genereazaCursul,
  planulGenerarii,
  type ConceptDeGenerat,
  type RaportCurs,
} from "@/lib/generare/curs";
import { CURS_PROPRIU, cu } from "@/lib/continut/livrate";

type StareModel =
  | { fel: "verifica" }
  | { fel: "nesuportat" }
  | { fel: "neinceput" }
  | { fel: "se-descarca"; raport: RaportProgres }
  | { fel: "gata" }
  | { fel: "eroare"; mesaj: string };

type StareGenerare =
  | { fel: "asteapta" }
  | { fel: "lucreaza"; raport: RaportCurs }
  | { fel: "gata"; generate: number; sarite: number }
  | { fel: "eroare"; mesaj: string };

type Plan =
  | { fel: "se-incarca" }
  | { fel: "gata"; concepte: ConceptDeGenerat[] }
  | { fel: "eroare"; mesaj: string };

export default function EcranGenereaza() {
  const [model, setModel] = useState<StareModel>({ fel: "verifica" });
  const [generare, setGenerare] = useState<StareGenerare>({ fel: "asteapta" });
  const [plan, setPlan] = useState<Plan>({ fel: "se-incarca" });
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
    planulGenerarii()
      .then((concepte) => !anulat && setPlan({ fel: "gata", concepte }))
      .catch((e: unknown) => !anulat && setPlan({ fel: "eroare", mesaj: mesajEroare(e) }));
    return () => {
      anulat = true;
    };
  }, [incarcari]);

  async function descarcaSiGenereaza() {
    setModel({ fel: "se-descarca", raport: { text: "Se pregătește…", progres: 0 } });
    try {
      await descarcaModelul((raport) => setModel({ fel: "se-descarca", raport }));
      setModel({ fel: "gata" });
      await genereaza();
    } catch (e) {
      setModel({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  async function genereaza() {
    setGenerare({ fel: "lucreaza", raport: { facute: 0, total: 1, nume: "" } });
    try {
      const { generate, sarite } = await genereazaCursul((raport) =>
        setGenerare({ fel: "lucreaza", raport }),
      );
      setGenerare({ fel: "gata", generate, sarite });
      reincarca((n) => n + 1);
    } catch (e) {
      setGenerare({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  const areLectiiGata =
    plan.fel === "gata" && plan.concepte.some((c) => c.gata);
  const deGenerat = plan.fel === "gata" ? plan.concepte.filter((c) => !c.gata).length : 0;

  return (
    <Ecran>
      <AntetEcran
        titlu="Cursul propriu"
        subtitlu="Fiecare concept din graf devine o lecție: un briefing scurt și un exercițiu verificat prin rulare reală, nu prin ce spune modelul. Durează — un model mic scrie încet. Poți închide fila și relua oricând."
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
              Browserul ăsta n-are WebGPU, deci cursul propriu nu se poate
              genera aici. Restul jocului merge la fel.
            </p>
          </Panou>
        ) : null}

        {model.fel === "neinceput" || model.fel === "se-descarca" || model.fel === "eroare" ? (
          <Panou titlu="Are nevoie de model">
            <p className="text-text-slab">
              Generarea cere modelul din browser (~{MARIME_APROX_MB} MB, o
              singură dată).
            </p>
            {model.fel === "neinceput" ? (
              <div>
                <Buton onClick={() => void descarcaSiGenereaza()}>
                  Descarcă modelul și generează
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
                  <Buton fel="secundar" onClick={() => void descarcaSiGenereaza()}>
                    Încearcă din nou
                  </Buton>
                </div>
              </>
            ) : null}
          </Panou>
        ) : null}

        {model.fel === "gata" ? (
          <Panou titlu="Generează">
            {generare.fel === "asteapta" ? (
              <>
                <p className="text-text-slab">
                  {plan.fel === "gata" && deGenerat === 0 && plan.concepte.length > 0
                    ? "Toate lecțiile din graf sunt gata."
                    : `${deGenerat} ${deGenerat === 1 ? "lecție" : "lecții"} de generat.`}
                </p>
                <div>
                  <Buton onClick={() => void genereaza()} disabled={deGenerat === 0}>
                    Generează cursul
                  </Buton>
                </div>
              </>
            ) : null}

            {generare.fel === "lucreaza" ? (
              <p aria-live="polite" className="text-sm text-text-slab">
                {generare.raport.facute} din {generare.raport.total}
                {generare.raport.nume ? ` — ${generare.raport.nume}` : ""}
              </p>
            ) : null}

            {generare.fel === "gata" ? (
              <p className="text-text-slab">
                {generare.generate} {generare.generate === 1 ? "lecție nouă" : "lecții noi"}
                {generare.sarite > 0
                  ? `. ${generare.sarite} ${generare.sarite === 1 ? "s-a" : "s-au"} sărit — modelul n-a scris ceva de folosit.`
                  : "."}
              </p>
            ) : null}

            {generare.fel === "eroare" ? (
              <>
                <p className="text-text-slab">N-a mers.</p>
                <p className="font-mono text-sm text-text-slab">{generare.mesaj}</p>
              </>
            ) : null}
          </Panou>
        ) : null}

        <Panou titlu="Planul">
          {plan.fel === "se-incarca" ? (
            <p className="text-text-slab">Se deschide baza de date locală.</p>
          ) : null}
          {plan.fel === "eroare" ? (
            <p className="font-mono text-sm text-text-slab">{plan.mesaj}</p>
          ) : null}
          {plan.fel === "gata" && plan.concepte.length === 0 ? (
            <p className="text-text-slab">
              Niciun concept încă — construiește mai întâi graful de concepte.
            </p>
          ) : null}
          {plan.fel === "gata" && plan.concepte.length > 0 ? (
            <ol className="flex flex-col gap-2">
              {plan.concepte.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-tema border border-contur p-3"
                >
                  <span className="text-sm text-text-slab">{i + 1}.</span>
                  <span aria-hidden="true">{c.gata ? "✓" : "·"}</span>
                  <span className="flex-1">{c.nume}</span>
                  <span className="text-sm text-text-slab">
                    {c.gata ? "gata" : "de generat"}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        {areLectiiGata ? (
          <ButonLegatura href={cu("/curs/", CURS_PROPRIU)}>Joacă cursul</ButonLegatura>
        ) : null}
        <ButonLegatura href="/concepte/" fel="secundar">
          Graful de concepte
        </ButonLegatura>
        <ButonLegatura href="/" fel="secundar">
          Înapoi
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}
