"use client";

import { useRef, useState } from "react";
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
  aplicaCopie,
  citesteCopie,
  faceCopie,
  numeFisier,
  textCopie,
  type FisierCopie,
  type RaportCopie,
} from "@/lib/date/copie";

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type Scriere =
  | { fel: "asteapta" }
  | { fel: "lucreaza" }
  | { fel: "gata"; nume: string }
  | { fel: "eroare"; mesaj: string };

type Citire =
  | { fel: "asteapta" }
  | { fel: "citit"; copie: FisierCopie; nume: string }
  | { fel: "lucreaza" }
  | { fel: "gata"; raport: RaportCopie }
  | { fel: "eroare"; mesaj: string };

export default function EcranCopie() {
  const [scriere, setScriere] = useState<Scriere>({ fel: "asteapta" });
  const [citire, setCitire] = useState<Citire>({ fel: "asteapta" });
  const alegator = useRef<HTMLInputElement>(null);

  async function scrieFisierul() {
    setScriere({ fel: "lucreaza" });
    try {
      const copie = await faceCopie();
      const nume = numeFisier();
      descarca(nume, textCopie(copie));
      setScriere({ fel: "gata", nume });
    } catch (e) {
      setScriere({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  async function alegeFisierul(fisier: File) {
    setCitire({ fel: "asteapta" });
    try {
      const copie = citesteCopie(await fisier.text());
      setCitire({ fel: "citit", copie, nume: fisier.name });
    } catch (e) {
      setCitire({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  async function pune(copie: FisierCopie) {
    setCitire({ fel: "lucreaza" });
    try {
      setCitire({ fel: "gata", raport: await aplicaCopie(copie) });
    } catch (e) {
      setCitire({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  return (
    <Ecran>
      <AntetEcran
        titlu="Copie de progres"
        subtitlu="Un fișier cu tot ce ai făcut, scris de tine și citit tot de tine. Nu pleacă nicăieri — nu există server."
      />
      <ContinutEcran>
        <Panou titlu="Scrie fișierul">
          <p className="text-text-slab">
            Încercările, briefingurile citite, XP-ul și setările intră
            într-un fișier JSON pe care browserul îl descarcă. Cursul nu intră
            în el: vine cu aplicația.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Buton onClick={scrieFisierul} disabled={scriere.fel === "lucreaza"}>
              {scriere.fel === "lucreaza" ? "Se scrie…" : "Descarcă progresul"}
            </Buton>
          </div>
          <p aria-live="polite" className="text-sm text-text-slab">
            {scriere.fel === "gata"
              ? `Scris în ${scriere.nume}. Caută-l unde îți pune browserul descărcările.`
              : scriere.fel === "eroare"
                ? "Fișierul nu s-a scris. Baza de date din browser n-a răspuns; datele tale sunt neatinse."
                : "Nimic nu se șterge din bază când scrii fișierul."}
          </p>
          {scriere.fel === "eroare" ? (
            <p className="font-mono text-sm text-text-slab">{scriere.mesaj}</p>
          ) : null}
        </Panou>

        <Panou titlu="Citește un fișier">
          <p className="text-text-slab">
            Ce e în fișier se adaugă peste ce e deja aici. Nimic nu se șterge și
            nimic nu se suprascrie: o încercare pe care o ai deja se sare, iar
            XP-ul nu poate ieși mai mic decât e acum.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={alegator}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                // Reset, ca alegerea aceluiași fișier a doua oară să declanșeze
                // tot evenimentul.
                ev.target.value = "";
                if (f) void alegeFisierul(f);
              }}
            />
            <Buton
              fel="secundar"
              onClick={() => alegator.current?.click()}
              disabled={citire.fel === "lucreaza"}
            >
              Alege fișierul…
            </Buton>
          </div>

          {citire.fel === "citit" ? (
            <div className="flex flex-col gap-3 rounded-tema border border-contur p-4">
              <p className="text-sm text-text-slab">
                <span className="font-mono">{citire.nume}</span>
              </p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                <Rand eticheta="Scris la" valoare={candScris(citire.copie)} />
                <Rand
                  eticheta="Cursuri"
                  valoare={
                    citire.copie.cursuri.map((c) => c.materie).join(", ") || "—"
                  }
                />
                <Rand
                  eticheta="XP în fișier"
                  valoare={String(
                    citire.copie.cursuri.reduce((s, c) => s + c.xp, 0),
                  )}
                />
                <Rand
                  eticheta="Încercări"
                  valoare={String(
                    citire.copie.cursuri.reduce(
                      (s, c) => s + c.incercari.length,
                      0,
                    ),
                  )}
                />
                <Rand
                  eticheta="Lecții"
                  valoare={String(
                    citire.copie.cursuri.reduce(
                      (s, c) => s + c.lectii.length,
                      0,
                    ),
                  )}
                />
                <Rand
                  eticheta="Nume"
                  valoare={citire.copie.setari.numeAfisat ?? "—"}
                />
              </dl>
              <div>
                <Buton onClick={() => void pune(citire.copie)}>
                  Adaugă în bază
                </Buton>
              </div>
            </div>
          ) : null}

          {citire.fel === "lucreaza" ? (
            <p aria-live="polite" className="text-sm text-text-slab">
              Se scriu rândurile…
            </p>
          ) : null}

          {citire.fel === "gata" ? (
            <div
              aria-live="polite"
              className="flex flex-col gap-3 rounded-tema border border-contur p-4"
            >
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                <Rand
                  eticheta="Încercări adăugate"
                  valoare={String(citire.raport.incercariAdaugate)}
                />
                <Rand
                  eticheta="Le aveai deja"
                  valoare={String(citire.raport.incercariDejaAvute)}
                />
                <Rand
                  eticheta="Briefinguri"
                  valoare={String(citire.raport.briefinguriAdaugate)}
                />
                <Rand
                  eticheta="Teste"
                  valoare={String(citire.raport.testeAdaugate)}
                />
                <Rand
                  eticheta="XP înainte"
                  valoare={String(citire.raport.xpInainte)}
                />
                <Rand
                  eticheta="XP acum"
                  valoare={String(citire.raport.xpDupa)}
                />
              </dl>
              {citire.raport.exercitiiNecunoscute > 0 ? (
                <p className="text-sm text-text-slab">
                  {citire.raport.exercitiiNecunoscute === 1
                    ? "O încercare din fișier trimite"
                    : `${citire.raport.exercitiiNecunoscute} încercări din fișier trimit`}{" "}
                  la exerciții care nu sunt în această versiune a cursului. Au
                  rămas în fișier; el nu s-a modificat.
                </p>
              ) : null}
            </div>
          ) : null}

          {citire.fel === "eroare" ? (
            <div className="flex flex-col gap-2">
              <p className="text-text-slab">{citire.mesaj}</p>
              <p className="text-sm text-text-slab">
                Baza n-a fost atinsă. Poți alege alt fișier.
              </p>
            </div>
          ) : null}
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        <ButonLegatura href="/curs/">Înapoi la curs</ButonLegatura>
        <ButonLegatura href="/progres/" fel="secundar">
          Progres
        </ButonLegatura>
        <ButonLegatura href="/setari/" fel="secundar">
          Setări
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

function candScris(copie: FisierCopie): string {
  const t = Date.parse(copie.scrisLa);
  return Number.isNaN(t) ? "—" : CAND.format(new Date(t));
}

/**
 * Descărcarea, fără server: fișierul se face în memorie și se dă browserului
 * printr-o legătură apăsată din cod.
 */
function descarca(nume: string, text: string) {
  const adresa = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = adresa;
  a.download = nume;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(adresa);
}
