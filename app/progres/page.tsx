"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Ecran,
  AntetEcran,
  ContinutEcran,
  BaraActiuni,
  Panou,
} from "@/componente/ecran";
import { Buton, ButonLegatura } from "@/componente/buton";
import { mesajEroare } from "@/lib/date/erori";
import { cheieCursului, cu } from "@/lib/continut/livrate";
import {
  hartaCursului,
  istoricIncercari,
  type Harta,
  type RandIstoric,
} from "@/lib/date/progres";
import { XP } from "@/lib/exercitii/xp";

type Stare =
  | { fel: "se-incarca" }
  | { fel: "gata"; harta: Harta; istoric: RandIstoric[] }
  | { fel: "eroare"; mesaj: string };

const CAND = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default function Pagina() {
  return (
    <Suspense
      fallback={
        <Ecran>
          <AntetEcran titlu="Progres" />
          <ContinutEcran>
            <Panou titlu="Progres">{null}</Panou>
          </ContinutEcran>
        </Ecran>
      }
    >
      <EcranProgres />
    </Suspense>
  );
}

function EcranProgres() {
  const cheie = cheieCursului(useSearchParams().get("curs"));
  const [stare, setStare] = useState<Stare>({ fel: "se-incarca" });
  const [incarcari, reincarca] = useState(0);

  useEffect(() => {
    let anulat = false;
    (async () => {
      const harta = await hartaCursului(cheie);
      const istoric = await istoricIncercari();
      if (!anulat) setStare({ fel: "gata", harta, istoric });
    })().catch((e: unknown) => {
      if (!anulat) setStare({ fel: "eroare", mesaj: mesajEroare(e) });
    });
    return () => {
      anulat = true;
    };
  }, [incarcari, cheie]);

  return (
    <Ecran>
      <AntetEcran
        titlu="Progres"
        subtitlu="Tot ce ai adunat, și de unde vine. Nimic de aici nu scade vreodată."
      />
      <ContinutEcran>
        {stare.fel === "se-incarca" ? (
          <Panou titlu="XP">
            <p className="text-text-slab">Se deschide baza de date locală.</p>
          </Panou>
        ) : null}

        {stare.fel === "eroare" ? (
          <Panou titlu="Progresul nu s-a încărcat">
            <p className="text-text-slab">
              Baza de date din browser n-a răspuns. Încercările tale stau acolo,
              neatinse.
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
          <Continut harta={stare.harta} istoric={stare.istoric} />
        ) : null}
      </ContinutEcran>

      <BaraActiuni>
        <ButonLegatura href={cu("/curs/", cheie)}>Înapoi la curs</ButonLegatura>
        <ButonLegatura href="/copie/" fel="secundar">
          Copie de progres
        </ButonLegatura>
        <ButonLegatura href="/" fel="secundar">
          Acasă
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}

function Continut({
  harta,
  istoric,
}: {
  harta: Harta;
  istoric: RandIstoric[];
}) {
  const niveluri = harta.capitole.flatMap((c) => c.niveluri);
  const terminate = niveluri.filter((n) => n.stare === "terminat").length;
  const urmatoarea = niveluri.find((n) => n.stare === "deschis");
  const incercari = niveluri.reduce((s, n) => s + n.incercate, 0);
  const exercitii = niveluri.reduce((s, n) => s + n.exercitii, 0);
  // Bonusurile de revenire nu aparțin niciunei lecții, deci suma pe lecții e
  // mai mică decât totalul. Se spune, ca să nu pară o greșeală de socoteală.
  const inAfara = harta.xp - niveluri.reduce((s, n) => s + n.xp, 0);

  return (
    <>
      <Panou>
        {/* Numărul mare e tot ce trebuie citit de la doi metri. */}
        <p className="text-5xl font-semibold tracking-tight sm:text-6xl">
          {harta.xp} XP
        </p>
        <p className="text-text-slab">
          Pe cursul {harta.materie}. Fiecare încercare adaugă, indiferent cum a
          ieșit.
        </p>
        {inAfara > 0 ? (
          <p className="text-sm text-text-slab">
            Din care {inAfara} XP din afara lecțiilor, pentru că te-ai întors
            după o pauză.
          </p>
        ) : null}
      </Panou>

      <Panou titlu="Unde ai ajuns">
        <ul className="flex flex-col gap-2 text-text-slab">
          <li>
            <strong className="text-text">
              {terminate} din {niveluri.length}
            </strong>{" "}
            lecții terminate.
          </li>
          <li>
            <strong className="text-text">
              {incercari} din {exercitii}
            </strong>{" "}
            exerciții încercate.
          </li>
          <li>
            {urmatoarea
              ? `Urmează: ${urmatoarea.nume}.`
              : "Ai deschis tot ce există deocamdată."}
          </li>
        </ul>
      </Panou>

      {harta.capitole.map((c) => (
        <Panou key={c.id} titlu={`Capitolul ${c.ordine} · ${c.nume}`}>
          <ul className="flex flex-col gap-3">
            {c.niveluri.map((n) => (
              <li
                key={n.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-contur pb-3 last:border-0 last:pb-0"
              >
                <span className="flex flex-col">
                  <span className="font-medium">
                    Lecția {n.ordine} · {n.nume}
                  </span>
                  <span className="text-sm text-text-slab">
                    {n.stare === "blocat"
                      ? "Se deschide când termini lecția dinainte."
                      : `${n.incercate} din ${n.exercitii} exerciții încercate${
                          n.briefingCitit ? " · briefing citit" : ""
                        }`}
                  </span>
                </span>
                <span className="font-mono">{n.xp} XP</span>
              </li>
            ))}
          </ul>
        </Panou>
      ))}

      <Panou titlu="Cum se adună">
        <ul className="flex flex-col gap-1 text-sm text-text-slab">
          <li>Ai citit un briefing: +{XP.briefing} XP, o dată pe lecție.</li>
          <li>Ai încercat un exercițiu: +{XP.incercare} XP, orice ar ieși.</li>
          <li>Fiecare caz de test care trece: +{XP.cazTrecut} XP.</li>
          <li>Toate cazurile trec: +{XP.toateCazurile} XP.</li>
          <li>Din prima: +{XP.dinPrima} XP.</li>
          <li>Te-ai întors după o pauză: +{XP.revenire} XP, în tăcere.</li>
        </ul>
      </Panou>

      <Panou titlu="Ultimele încercări">
        {istoric.length === 0 ? (
          <p className="text-text-slab">
            Încă nu ai rulat nimic. Când o faci, fiecare rulare rămâne aici —
            nimic nu se șterge.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {istoric.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-contur pb-3 last:border-0 last:pb-0"
              >
                <span className="flex flex-col">
                  <span>{r.exercitiu}</span>
                  <span className="text-sm text-text-slab">
                    {r.lectie} · {CAND.format(r.cand)}
                  </span>
                </span>
                <span className="font-mono text-sm text-text-slab">
                  {r.total === null || r.total === 0
                    ? `+${r.xp} XP`
                    : `${r.trecute} din ${r.total} · +${r.xp} XP`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panou>
    </>
  );
}
