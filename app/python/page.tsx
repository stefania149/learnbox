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
import { python, RABDARE_MS, type Rezultat } from "@/lib/python/client";
import { mesajEroare } from "@/lib/date/erori";

const COD_INITIAL = `nume = "lume"
print(f"Salut, {nume}!")

def suma(numere):
    total = 0
    for n in numere:
        total += n
    return total

print(suma([1, 2, 3]))
`;

const BUCLA_FARA_SFARSIT = `# Nu se oprește singură. Cronometrul o oprește.
while True:
    pass
`;

type Stare =
  | { fel: "nepornit" }
  | { fel: "se-pregateste" }
  | { fel: "ruleaza" }
  | { fel: "rezultat"; rezultat: Rezultat }
  | { fel: "eroare-pornire"; mesaj: string };

export default function EcranPython() {
  const [cod, setCod] = useState(COD_INITIAL);
  const [stare, setStare] = useState<Stare>({ fel: "nepornit" });
  const zonaCod = useRef<HTMLTextAreaElement>(null);

  async function ruleaza() {
    const motor = python();
    setStare({ fel: "se-pregateste" });
    try {
      await motor.pregateste();
    } catch (e) {
      setStare({ fel: "eroare-pornire", mesaj: mesajEroare(e) });
      return;
    }

    setStare({ fel: "ruleaza" });
    const rezultat = await motor.ruleaza(cod);
    setStare({ fel: "rezultat", rezultat });
  }

  function puneBucla() {
    setCod(BUCLA_FARA_SFARSIT);
    zonaCod.current?.focus();
  }

  const seLucreaza = stare.fel === "se-pregateste" || stare.fel === "ruleaza";

  return (
    <Ecran>
      <AntetEcran
        titlu="Rulare Python"
        subtitlu="Python adevărat, în browser, pe un fir separat de interfață."
      />
      <ContinutEcran>
        <Panou>
          <label htmlFor="cod" className="text-sm font-medium">
            Cod Python
          </label>
          <textarea
            id="cod"
            ref={zonaCod}
            value={cod}
            onChange={(e) => setCod(e.target.value)}
            spellCheck={false}
            rows={12}
            className="w-full rounded-tema border border-contur bg-fundal p-4 font-mono text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <p className="text-sm text-text-slab">
            O rulare are {RABDARE_MS / 1000} secunde. Dacă le depășește, firul se
            oprește și repornește singur — fila nu îngheață.
          </p>
        </Panou>

        <Panou titlu="Rezultat">
          {stare.fel === "nepornit" ? (
            <p className="text-text-slab">
              Încă n-ai rulat nimic. La prima rulare se aduc ~13 MB: Python
              întreg, compilat pentru browser. Pe urmă pornește instant.
            </p>
          ) : null}

          {stare.fel === "se-pregateste" ? (
            <p className="text-text-slab">
              Se pregătește Python. Prima dată durează — se descarcă
              interpretorul și biblioteca standard.
            </p>
          ) : null}

          {stare.fel === "ruleaza" ? (
            <p className="text-text-slab">Rulează…</p>
          ) : null}

          {stare.fel === "eroare-pornire" ? (
            <>
              <p className="text-text-slab">
                Python n-a pornit. De obicei conexiunea a picat în timpul
                descărcării, sau browserul blochează firele separate.
              </p>
              <p className="font-mono text-sm text-text-slab">{stare.mesaj}</p>
              <div>
                <Buton fel="secundar" onClick={ruleaza}>
                  Încearcă din nou
                </Buton>
              </div>
            </>
          ) : null}

          {stare.fel === "rezultat" ? (
            <VeziRezultat rezultat={stare.rezultat} />
          ) : null}
        </Panou>
      </ContinutEcran>

      <BaraActiuni>
        <Buton onClick={ruleaza} disabled={seLucreaza}>
          {seLucreaza ? "Se lucrează…" : "Rulează"}
        </Buton>
        <Buton fel="secundar" onClick={puneBucla} disabled={seLucreaza}>
          Pune o buclă fără sfârșit
        </Buton>
        <ButonLegatura href="/" fel="secundar">
          Înapoi
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}

function VeziRezultat({ rezultat }: { rezultat: Rezultat }) {
  return (
    <div className="flex flex-col gap-4">
      {rezultat.iesire.length > 0 ? (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-tema bg-fundal p-4 font-mono text-sm">
          {rezultat.iesire.map((l) => l.text).join("\n")}
        </pre>
      ) : null}

      {rezultat.fel === "gata" ? (
        <p className="text-sm text-text-slab">
          {rezultat.valoare === null
            ? "S-a terminat."
            : `S-a terminat. Ultima expresie: ${rezultat.valoare}`}
        </p>
      ) : null}

      {rezultat.fel === "eroare" ? (
        <>
          <p className="text-sm text-text-slab">
            Python s-a oprit și a explicat de ce:
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-tema border border-contur p-4 font-mono text-sm">
            {rezultat.eroare}
          </pre>
        </>
      ) : null}

      {rezultat.fel === "timp-expirat" ? (
        <p className="text-text-slab">
          Codul tău a rulat {rezultat.secunde} secunde și nu s-a oprit. Probabil
          ai o buclă care nu se termină — verifică dacă ceva chiar schimbă
          condiția.
        </p>
      ) : null}
    </div>
  );
}
