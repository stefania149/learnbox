"use client";

import { useEffect, useState } from "react";
import {
  Ecran,
  AntetEcran,
  ContinutEcran,
  BaraActiuni,
  Panou,
} from "@/componente/ecran";
import { Buton, ButonLegatura } from "@/componente/buton";
import { Alegere, GrupAlegere } from "@/componente/alegere";
import { mesajEroare } from "@/lib/date/erori";
import {
  citesteSetari,
  scrieRegistruTon,
  scrieTemaActiva,
  REGISTRE_TON,
  type RegistruTon,
  type Setari,
} from "@/lib/date/setari";
import { TEME, TEMA_AUTOMATA } from "@/lib/teme/teme";
import { temaCurenta } from "@/lib/teme/rezolva";

type Stare =
  | { fel: "se-incarca" }
  | { fel: "gata"; setari: Setari }
  | { fel: "eroare"; mesaj: string };

export default function EcranSetari() {
  const [stare, setStare] = useState<Stare>({ fel: "se-incarca" });
  const [seScrie, setSeScrie] = useState(false);
  const [salvatLa, setSalvatLa] = useState<Date | null>(null);
  const [incarcari, reincarca] = useState(0);

  useEffect(() => {
    let anulat = false;
    citesteSetari()
      .then((setari) => !anulat && setStare({ fel: "gata", setari }))
      .catch(
        (e: unknown) =>
          !anulat &&
          setStare({ fel: "eroare", mesaj: mesajEroare(e) }),
      );
    return () => {
      anulat = true;
    };
  }, [incarcari]);

  async function alege(valoare: string) {
    setSeScrie(true);
    try {
      const noi = await scrieRegistruTon(valoare as RegistruTon);
      setStare({ fel: "gata", setari: noi });
      setSalvatLa(new Date());
    } catch (e) {
      setStare({
        fel: "eroare",
        mesaj: mesajEroare(e),
      });
    } finally {
      setSeScrie(false);
    }
  }

  async function alegeTema(valoare: string) {
    setSeScrie(true);
    try {
      const noi = await scrieTemaActiva(valoare);
      // Vizibil imediat, nu doar după ce scrie baza de date — o temă se simte
      // schimbată pe loc, nu „la reîncărcare" (spre deosebire de ton, mai jos).
      // „Automat" nu e o temă CSS — se rezolvă la cursul curent, ca oriunde.
      document.documentElement.dataset.tema = await temaCurenta(
        noi.temaActiva,
        noi.materieActiva,
      );
      setStare({ fel: "gata", setari: noi });
      setSalvatLa(new Date());
    } catch (e) {
      setStare({ fel: "eroare", mesaj: mesajEroare(e) });
    } finally {
      setSeScrie(false);
    }
  }

  return (
    <Ecran>
      <AntetEcran
        titlu="Setări"
        subtitlu="Se păstrează pe calculatorul acesta, în baza de date din browser."
      />
      <ContinutEcran>
        {stare.fel === "se-incarca" ? (
          <Panou titlu="Ton">
            <p className="text-text-slab">
              Se deschide baza de date locală. Prima deschidere durează câteva
              secunde — se aduce motorul Postgres în browser.
            </p>
          </Panou>
        ) : null}

        {stare.fel === "eroare" ? (
          <Panou titlu="Baza de date nu s-a deschis">
            <p className="text-text-slab">
              Setările se păstrează într-o bază de date din browser, iar ea n-a
              pornit. De obicei e una din două: fereastră privată ori date
              blocate pentru acest site, sau motorul (câteva megabyte) n-a
              apucat să se descarce.
            </p>
            <p className="font-mono text-sm text-text-slab">{stare.mesaj}</p>
            <div>
              <Buton fel="secundar" onClick={() => reincarca((n) => n + 1)}>
                Încearcă din nou
              </Buton>
            </div>
          </Panou>
        ) : null}

        {stare.fel === "gata" ? (
          <Panou>
            <GrupAlegere
              legenda="Temă"
              ajutor="Cum arată tot jocul. Se schimbă pe loc, pe orice ecran."
            >
              <Alegere
                nume="tema-activa"
                valoare={TEMA_AUTOMATA}
                titlu="Automat"
                explicatie="Fiecare curs cu tema lui potrivită."
                aleasa={stare.setari.temaActiva === TEMA_AUTOMATA}
                dezactivata={seScrie}
                onAlege={alegeTema}
              />
              {TEME.map((tema) => (
                <Alegere
                  key={tema.id}
                  nume="tema-activa"
                  valoare={tema.id}
                  titlu={tema.nume}
                  explicatie={tema.explicatie}
                  aleasa={stare.setari.temaActiva === tema.id}
                  dezactivata={seScrie}
                  onAlege={alegeTema}
                />
              ))}
            </GrupAlegere>

            <GrupAlegere
              legenda="Ton"
              ajutor="Cum îți răspunde jocul când termini ceva. Se schimbă oricând."
            >
              {REGISTRE_TON.map((registru) => (
                <Alegere
                  key={registru.valoare}
                  nume="registru-ton"
                  valoare={registru.valoare}
                  titlu={registru.nume}
                  explicatie={registru.explicatie}
                  aleasa={stare.setari.registruTon === registru.valoare}
                  dezactivata={seScrie}
                  onAlege={alege}
                />
              ))}
            </GrupAlegere>
            <p aria-live="polite" className="text-sm text-text-slab">
              {seScrie
                ? "Se scrie…"
                : salvatLa
                  ? `Salvat la ${salvatLa.toLocaleTimeString("ro-RO")}.`
                  : "Alegerea se salvează în clipa în care o faci."}
            </p>
          </Panou>
        ) : null}
      </ContinutEcran>
      <BaraActiuni>
        <ButonLegatura href="/" fel="secundar">
          Înapoi
        </ButonLegatura>
        <ButonLegatura href="/copie/" fel="secundar">
          Copie de progres
        </ButonLegatura>
        <ButonLegatura href="/stare/" fel="secundar">
          Aplicația
        </ButonLegatura>
        <ButonLegatura href="/import/" fel="secundar">
          Materialul tău
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}
