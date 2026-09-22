"use client";

/*
 * „Aplicația" — ce era ecranul de stare al browserului, rescris la pasul 10.
 *
 * Trei lucruri, în ordinea în care le vrei: o instalezi, o pregătești să
 * meargă fără internet, și te uiți ce are browserul sub ea.
 */

import { useState, useSyncExternalStore } from "react";
import {
  Ecran,
  AntetEcran,
  ContinutEcran,
  BaraActiuni,
  Panou,
} from "@/componente/ecran";
import { Buton, ButonLegatura } from "@/componente/buton";
import { mesajEroare } from "@/lib/date/erori";
import { citesteDiagnostic, type DiagnosticDate } from "@/lib/date/diagnostic";
import { deschideBaza } from "@/lib/date/client";
import { python } from "@/lib/python/client";
import { sql } from "@/lib/sql/client";
import {
  aplicaActualizarea,
  ceriInstalarea,
  useStareAplicatie,
} from "@/componente/pwa";

type Verificare = { nume: string; explicatie: string; prezent: boolean };

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
      explicatie: "Cu el, aplicația se instalează și pornește fără internet.",
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

function marime(octeti: number | null): string {
  if (octeti === null) return "—";
  const mb = octeti / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(0)} MB` : `${(octeti / 1024).toFixed(0)} KB`;
}

type Pregatire =
  | { fel: "asteapta" }
  | { fel: "lucreaza"; ce: string }
  | { fel: "gata" }
  | { fel: "eroare"; mesaj: string };

export default function Aplicatia() {
  const inBrowser = useEsteInBrowser();
  const { stare, reciteste } = useStareAplicatie();
  const [pregatire, setPregatire] = useState<Pregatire>({ fel: "asteapta" });
  const [seInstaleaza, setSeInstaleaza] = useState(false);
  const verificari = inBrowser ? verifica() : null;

  async function instaleaza() {
    setSeInstaleaza(true);
    try {
      await ceriInstalarea();
    } finally {
      setSeInstaleaza(false);
      reciteste();
    }
  }

  // Motoarele nu se descarcă la instalare — sunt 31 MB. Se aduc când le ceri
  // anume, pornindu-le o dată: ce trece prin rețea rămâne în depozit.
  async function pregatesteOffline() {
    try {
      setPregatire({ fel: "lucreaza", ce: "Se aduce baza de date…" });
      await deschideBaza();
      setPregatire({ fel: "lucreaza", ce: "Se aduce Python…" });
      await python().pregateste();
      // Al doilea motor, cel pe care rulează cursul de SQL. E același
      // Postgres ca al bazei, deci de obicei vine din depozit.
      setPregatire({ fel: "lucreaza", ce: "Se aduce Postgres…" });
      await sql().pregateste();
      setPregatire({ fel: "gata" });
    } catch (e) {
      setPregatire({ fel: "eroare", mesaj: mesajEroare(e) });
    } finally {
      reciteste();
    }
  }

  return (
    <Ecran>
      <AntetEcran
        titlu="Aplicația"
        subtitlu="Se instalează ca un program obișnuit și pornește și fără internet. Tot ce are nevoie stă pe calculatorul acesta."
      />
      <ContinutEcran>
        <Panou titlu="Instalare">
          {stare.instalata ? (
            <p className="text-text-slab">
              Rulează instalată, în fereastra ei. Se dezinstalează din meniul
              ferestrei, ca orice program; progresul rămâne în browser.
            </p>
          ) : stare.sePoateInstala ? (
            <>
              <p className="text-text-slab">
                Primești o iconiță și o fereastră fără bară de adrese. Nu se
                descarcă nimic în plus: e aceeași aplicație, doar pornită
                altfel.
              </p>
              <div>
                <Buton onClick={instaleaza} disabled={seInstaleaza}>
                  {seInstaleaza ? "Se întreabă…" : "Instalează"}
                </Buton>
              </div>
            </>
          ) : (
            <p className="text-text-slab">
              Browserul acesta nu oferă butonul de instalare. În Chrome și Edge
              apare o iconiță în bara de adrese; în Safari, „Adaugă în Dock&rdquo;
              sau „Adaugă pe ecranul principal&rdquo;. Aplicația merge la fel și
              neinstalată.
            </p>
          )}
        </Panou>

        <Panou titlu="Fără internet">
          <p className="text-text-slab">
            Paginile se rețin singure la prima vizită. Python și baza de date
            sunt 31 MB și se aduc doar când le folosești — sau acum, dinadins,
            dacă știi că urmează un drum fără semnal.
          </p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <Rand
              eticheta="Paginile"
              valoare={stare.pregatitOffline ? "reținute" : "nereținute"}
            />
            <Rand
              eticheta="Python și baza"
              valoare={stare.motoareRetinute ? "reținute" : "nereținute"}
            />
            <Rand eticheta="Ocupă" valoare={marime(stare.ocupat)} />
          </dl>
          <div className="flex flex-wrap items-center gap-3">
            <Buton
              fel="secundar"
              onClick={pregatesteOffline}
              disabled={pregatire.fel === "lucreaza"}
            >
              {pregatire.fel === "lucreaza"
                ? "Se aduce…"
                : "Pregătește pentru offline"}
            </Buton>
          </div>
          <p aria-live="polite" className="text-sm text-text-slab">
            {pregatire.fel === "lucreaza"
              ? pregatire.ce
              : pregatire.fel === "gata"
                ? "Gata. De acum pornește și fără internet."
                : pregatire.fel === "eroare"
                  ? "Nu s-a adus tot. Mai încearcă atunci când ai semnal; nimic nu s-a stricat."
                  : "Se poate face oricând, de câte ori vrei."}
          </p>
          {pregatire.fel === "eroare" ? (
            <p className="font-mono text-sm text-text-slab">{pregatire.mesaj}</p>
          ) : null}
        </Panou>

        {stare.actualizareGata ? (
          <Panou titlu="Versiune nouă">
            <p className="text-text-slab">
              O versiune nouă e descărcată și așteaptă. Se aplică singură data
              viitoare când deschizi aplicația, sau acum, dacă vrei.
            </p>
            <div>
              <Buton onClick={() => void aplicaActualizarea()}>
                Aplică acum
              </Buton>
            </div>
          </Panou>
        ) : null}

        <Panou titlu="Ce are browserul">
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

        <BazaLocala />

        <Panou titlu="Versiune">
          <p className="font-mono text-sm text-text-slab">{versiune}</p>
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        <Buton fel="secundar" onClick={reciteste}>
          Verifică din nou
        </Buton>
        <ButonLegatura href="/copie/" fel="secundar">
          Copie de progres
        </ButonLegatura>
        <ButonLegatura href="/" fel="secundar">
          Înapoi
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}

function Rand({ eticheta, valoare }: { eticheta: string; valoare: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wide text-text-slab">
        {eticheta}
      </dt>
      <dd className="font-medium">{valoare}</dd>
    </div>
  );
}

type StareDate =
  | { fel: "asteapta" }
  | { fel: "se-incarca" }
  | { fel: "gata"; diagnostic: DiagnosticDate }
  | { fel: "eroare"; mesaj: string };

/**
 * Diagnosticul bazei nu se mai cere la deschiderea ecranului: ar porni motorul
 * Postgres, adică ar aduce 18 MB doar ca să te uiți dacă merge instalarea.
 */
function BazaLocala() {
  const [stare, setStare] = useState<StareDate>({ fel: "asteapta" });

  async function citeste() {
    setStare({ fel: "se-incarca" });
    try {
      setStare({ fel: "gata", diagnostic: await citesteDiagnostic() });
    } catch (e) {
      setStare({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  return (
    <Panou titlu="Baza de date locală">
      {stare.fel === "asteapta" ? (
        <>
          <p className="text-text-slab">
            Ce tabele există și ce migrări s-au aplicat. Deschiderea bazei aduce
            motorul Postgres, deci se face doar dacă ceri.
          </p>
          <div>
            <Buton fel="secundar" onClick={citeste}>
              Arată
            </Buton>
          </div>
        </>
      ) : null}

      {stare.fel === "se-incarca" ? (
        <p className="text-text-slab">
          Se deschide baza. Prima deschidere durează câteva secunde.
        </p>
      ) : null}

      {stare.fel === "eroare" ? (
        <>
          <p className="text-text-slab">
            Baza n-a pornit. De obicei e una din două: fereastră privată ori
            date blocate pentru acest site, sau motorul n-a apucat să se
            descarce. Restul aplicației merge; progresul n-ar avea unde să se
            păstreze.
          </p>
          <p className="font-mono text-sm text-text-slab">{stare.mesaj}</p>
          <div>
            <Buton fel="secundar" onClick={citeste}>
              Încearcă din nou
            </Buton>
          </div>
        </>
      ) : null}

      {stare.fel === "gata" ? (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Migrări aplicate</span>
            <ul className="flex flex-col gap-1">
              {stare.diagnostic.migrari.map((m) => (
                <li key={m.nume} className="font-mono text-sm text-text-slab">
                  {m.nume}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              Tabele ({stare.diagnostic.tabele.length})
            </span>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {stare.diagnostic.tabele.map((t) => (
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
  );
}
