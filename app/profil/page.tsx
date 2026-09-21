"use client";

import { useEffect, useRef, useState } from "react";
import {
  Afis,
  Autocolant,
  Dulap,
  FanteUsa,
  PortretPixeli,
  Raft,
  Sageata,
  ScrisDeMana,
  Stele,
  Vestiar,
} from "@/componente/dulap";
import { Buton, ButonLegatura } from "@/componente/buton";
import { mesajEroare } from "@/lib/date/erori";
import { hartaCursului, type Harta } from "@/lib/date/progres";
import { citesteSetari, scrieNumeAfisat } from "@/lib/date/setari";

/**
 * Profilul: un dulap de vestiar cu afișul tău lipit înăuntru.
 *
 * Tot ce scrie aici e citit din baza de date din browser. Numele e singurul
 * lucru pe care îl scrii tu, și stă tot acolo — nu e cont, nu pleacă nicăieri
 * și nu-l vede nimeni altcineva (`PLAN.md` §3).
 */

type Salvare =
  | { fel: "linistit" }
  | { fel: "se-scrie" }
  | { fel: "salvat" }
  | { fel: "eroare"; mesaj: string };

type Stare =
  | { fel: "se-incarca" }
  | { fel: "gata"; harta: Harta; nume: string }
  | { fel: "eroare" };

export default function EcranProfil() {
  const [stare, setStare] = useState<Stare>({ fel: "se-incarca" });
  const [salvare, setSalvare] = useState<Salvare>({ fel: "linistit" });
  // Câmpul e necontrolat: ce scrii rămâne scris chiar dacă ecranul se
  // redesenează în timp ce baza răspunde.
  const camp = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let anulat = false;
    (async () => {
      const harta = await hartaCursului();
      const setari = await citesteSetari();
      if (anulat) return;
      const scris = setari.numeAfisat ?? "";
      if (camp.current) camp.current.value = scris;
      setStare({ fel: "gata", harta, nume: scris });
    })().catch(() => {
      if (!anulat) setStare({ fel: "eroare" });
    });
    return () => {
      anulat = true;
    };
  }, []);

  async function salveaza() {
    if (stare.fel !== "gata") return;
    setSalvare({ fel: "se-scrie" });
    try {
      const noi = await scrieNumeAfisat(camp.current?.value ?? "");
      const curat = noi.numeAfisat ?? "";
      if (camp.current) camp.current.value = curat;
      setStare({ ...stare, nume: curat });
      setSalvare({ fel: "salvat" });
    } catch (e: unknown) {
      // Un nume care nu s-a scris trebuie să se vadă că nu s-a scris.
      setSalvare({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  const harta = stare.fel === "gata" ? stare.harta : null;
  const niveluri = harta?.capitole.flatMap((c) => c.niveluri) ?? [];
  const terminate = niveluri.filter((n) => n.stare === "terminat").length;
  const incercate = niveluri.reduce((s, n) => s + n.incercate, 0);
  const exercitii = niveluri.reduce((s, n) => s + n.exercitii, 0);
  const urmatoarea = niveluri.find((n) => n.stare === "deschis");

  return (
    <Vestiar>
      <Dulap
        usa={
          <>
            <Autocolant>{harta ? harta.materie : "Curs"}</Autocolant>
            <Autocolant>{harta ? `${harta.xp} XP` : "— XP"}</Autocolant>
            <FanteUsa />
          </>
        }
      >
        {/* Pe lat, etichetele stau la stânga afișului, ca pe perete; pe
            telefon trec sub el. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
          <div className="order-1 flex-1 sm:order-2">
            <Stele />
            <Afis>
              <PortretPixeli />
            </Afis>
          </div>

          <div className="order-2 flex flex-col gap-4 sm:order-1 sm:w-48 sm:gap-6 sm:pt-10">
            <ScrisDeMana>Jucător</ScrisDeMana>
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void salveaza();
              }}
            >
              <input
                ref={camp}
                defaultValue=""
                onInput={() => setSalvare({ fel: "linistit" })}
                disabled={stare.fel !== "gata" || salvare.fel === "se-scrie"}
                maxLength={40}
                aria-label="Numele tău pe profil"
                placeholder="Pune-ți un nume"
                className="min-h-11 w-full max-w-56 rounded-tema bg-dulap-afis px-3 text-lg italic text-dulap-scris placeholder:text-dulap-text-slab focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dulap-scris"
              />
              <span className="flex flex-wrap items-center gap-3">
                <Buton type="submit" fel="secundar">
                  {salvare.fel === "se-scrie" ? "Se scrie…" : "Salvează"}
                </Buton>
              </span>
              <span className="text-xs text-dulap-text-slab">
                {salvare.fel === "eroare"
                  ? salvare.mesaj
                  : salvare.fel === "salvat"
                    ? "Salvat pe calculatorul tău."
                    : "Stă pe calculatorul tău. Nu-l vede nimeni altcineva."}
              </span>
            </form>
          </div>
        </div>

        <div className="-mt-2">
          <ScrisDeMana marime="mare">{harta ? harta.materie : "—"}</ScrisDeMana>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <ScrisDeMana>Despre mine..</ScrisDeMana>
            <Sageata className="rotate-180" />
            <p className="text-sm leading-relaxed text-dulap-text">
              {harta
                ? `${harta.xp} XP adunate. ${terminate} din ${niveluri.length} lecții terminate, ${incercate} din ${exercitii} exerciții încercate.`
                : "Se citește de pe calculatorul tău."}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <ScrisDeMana>Ce urmează:-</ScrisDeMana>
            <Sageata />
            <p className="text-sm leading-relaxed text-dulap-text">
              {harta
                ? urmatoarea
                  ? `${urmatoarea.nume} — ${urmatoarea.exercitii - urmatoarea.incercate} exerciții neîncercate.`
                  : "Ai deschis tot ce există deocamdată."
                : "Se citește de pe calculatorul tău."}
            </p>
          </div>
        </div>

        {stare.fel === "eroare" ? (
          <p className="text-sm text-dulap-text-slab">
            Baza de date din browser n-a răspuns. Progresul tău e acolo,
            neatins.
          </p>
        ) : null}

        <Raft />
      </Dulap>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButonLegatura href="/curs/">Înapoi la curs</ButonLegatura>
        <ButonLegatura href="/progres/" fel="secundar">
          Progres
        </ButonLegatura>
        <ButonLegatura href="/" fel="secundar">
          Acasă
        </ButonLegatura>
      </div>
    </Vestiar>
  );
}
