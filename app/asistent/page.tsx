"use client";

/*
 * Chatul cu asistentul — pasul 21. O unealtă, nu un personaj: se deschide
 * când ai nevoie de el, tace când n-ai (`PLAN.md` §9). Nu inițiază — de-aia
 * ecranul gol arată o notiță de interfață, nu un „Bună!" scris ca replică a
 * asistentului.
 *
 * După fiecare schimb, extragerea faptelor rulează în fundal
 * (`lib/asistent/extrage.ts`) și scrie direct în `memorie` — ecranul care le
 * arată editabile, unul câte unul, vine la pasul 22.
 */

import { useEffect, useRef, useState } from "react";
import { Ecran, AntetEcran, ContinutEcran, BaraActiuni, Panou } from "@/componente/ecran";
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
  faptele,
  istoricConversatiei,
  scrieMesajul,
  adaugaFaptul,
  type Fapt,
  type Mesaj,
} from "@/lib/date/asistent";
import { raspundeAsistentul } from "@/lib/asistent/chat";
import { extrageFaptele } from "@/lib/asistent/extrage";
import type { MLCEngineInterface } from "@mlc-ai/web-llm";

type StareModel =
  | { fel: "verifica" }
  | { fel: "nesuportat" }
  | { fel: "neinceput" }
  | { fel: "se-descarca"; raport: RaportProgres }
  | { fel: "gata"; motor: MLCEngineInterface }
  | { fel: "eroare"; mesaj: string };

export default function EcranAsistent() {
  const [model, setModel] = useState<StareModel>({ fel: "verifica" });
  const [istoric, setIstoric] = useState<Mesaj[] | null>(null);
  const [fapte, setFapte] = useState<Fapt[]>([]);
  const [intrebare, setIntrebare] = useState("");
  const [trimite, setTrimite] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);
  const [faptNou, setFaptNou] = useState<string | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anulat = false;
    (async () => {
      const pornit = motorPornit();
      if (pornit) {
        const motor = await pornit.catch(() => null);
        if (!anulat) setModel(motor ? { fel: "gata", motor } : { fel: "neinceput" });
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
    Promise.all([istoricConversatiei(), faptele()])
      .then(([i, f]) => {
        if (!anulat) {
          setIstoric(i);
          setFapte(f);
        }
      })
      .catch((e: unknown) => !anulat && setEroare(mesajEroare(e)));
    return () => {
      anulat = true;
    };
  }, []);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [istoric]);

  async function descarca() {
    setModel({ fel: "se-descarca", raport: { text: "Se pregătește…", progres: 0 } });
    try {
      const motor = await descarcaModelul((raport) => setModel({ fel: "se-descarca", raport }));
      setModel({ fel: "gata", motor });
    } catch (e) {
      setModel({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  async function trimiteIntrebarea() {
    if (model.fel !== "gata" || !intrebare.trim() || trimite) return;
    const text = intrebare.trim();
    setIntrebare("");
    setEroare(null);
    setFaptNou(null);
    setTrimite(true);
    const motor = model.motor;

    try {
      const mesajUtilizator = await scrieMesajul("utilizator", text);
      const istoricCuIntrebare = [...(istoric ?? []), mesajUtilizator];
      setIstoric(istoricCuIntrebare);

      const raspuns = await raspundeAsistentul(motor, istoricCuIntrebare, fapte);
      const mesajAsistent = await scrieMesajul("asistent", raspuns);
      setIstoric([...istoricCuIntrebare, mesajAsistent]);
      setTrimite(false);

      extrageFaptele(motor, text, raspuns, fapte)
        .then(async (noi) => {
          if (noi.length === 0) return;
          for (const f of noi) await adaugaFaptul(f.tip, f.continut);
          const actualizate = await faptele();
          setFapte(actualizate);
          setFaptNou(noi.map((f) => f.continut).join(" · "));
        })
        .catch(() => {
          // Extragerea e în fundal — o eroare aici nu strică chatul.
        });
    } catch (e) {
      setEroare(mesajEroare(e));
      setTrimite(false);
    }
  }

  return (
    <Ecran>
      <AntetEcran
        titlu="Asistent"
        subtitlu="Întreabă orice despre materie. Nu laudă, nu consolează, nu inițiază — răspunde doar când îl întrebi."
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
              Browserul ăsta n-are WebGPU, deci asistentul nu poate răspunde aici.
              Restul jocului merge la fel.
            </p>
          </Panou>
        ) : null}

        {model.fel === "neinceput" || model.fel === "se-descarca" || model.fel === "eroare" ? (
          <Panou titlu="Are nevoie de model">
            <p className="text-text-slab">
              Chatul cere modelul din browser (~{MARIME_APROX_MB} MB, o singură dată).
            </p>
            {model.fel === "neinceput" ? (
              <div>
                <Buton onClick={() => void descarca()}>Descarcă modelul</Buton>
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
                  <Buton fel="secundar" onClick={() => void descarca()}>
                    Încearcă din nou
                  </Buton>
                </div>
              </>
            ) : null}
          </Panou>
        ) : null}

        {model.fel === "gata" ? (
          <Panou titlu="Chat">
            <div
              ref={listaRef}
              className="flex max-h-96 flex-col gap-3 overflow-y-auto"
            >
              {istoric === null ? (
                <p className="text-text-slab">Se deschide baza de date locală.</p>
              ) : istoric.length === 0 ? (
                <p className="text-text-slab">
                  N-ai întrebat încă nimic. Scrie mai jos.
                </p>
              ) : (
                istoric.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-tema border p-3 text-sm ${
                      m.rol === "utilizator"
                        ? "self-end border-accent bg-suprafata"
                        : "self-start border-contur"
                    }`}
                  >
                    {m.text}
                  </div>
                ))
              )}
            </div>

            {faptNou ? (
              <p className="text-xs text-text-slab">Reținut: {faptNou}</p>
            ) : null}

            {eroare ? <p className="font-mono text-sm text-text-slab">{eroare}</p> : null}

            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                void trimiteIntrebarea();
              }}
            >
              <textarea
                value={intrebare}
                onChange={(e) => setIntrebare(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void trimiteIntrebarea();
                  }
                }}
                disabled={trimite}
                rows={2}
                placeholder="Întreabă ceva despre materie…"
                aria-label="Întrebarea ta"
                className="min-h-11 flex-1 resize-none rounded-tema border border-contur bg-suprafata p-3 text-sm text-text placeholder:text-text-slab focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              />
              <Buton type="submit" disabled={trimite || !intrebare.trim()}>
                {trimite ? "Se gândește…" : "Trimite"}
              </Buton>
            </form>
          </Panou>
        ) : null}
      </ContinutEcran>
      <BaraActiuni>
        <ButonLegatura href="/memorie/" fel="secundar">
          Memorie
        </ButonLegatura>
        <ButonLegatura href="/" fel="secundar">
          Înapoi
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}
