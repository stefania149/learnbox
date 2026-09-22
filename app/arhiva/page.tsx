"use client";

/*
 * Arhiva — pasul 15. Se deschide când toate testele materiei au fost duse
 * măcar o dată (`PLAN.md` §5, §8): „Testele îți deschid Arhiva de la final.
 * Poți sări peste, dar ea rămâne închisă."
 *
 * Rezumatul e calculat mecanic din `incercare`, nu scris de un model
 * (principiul 1). E singurul ecran care nu poate exista fără istoricul tău.
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Ecran,
  AntetEcran,
  ContinutEcran,
  BaraActiuni,
  Panou,
} from "@/componente/ecran";
import { Buton, ButonLegatura } from "@/componente/buton";
import { mesajEroare } from "@/lib/date/erori";
import { cheieCursului, cu, type CheieCurs } from "@/lib/continut/livrate";
import {
  stareaArhivei,
  type ConfuzieArhiva,
  type ExercitiuArhiva,
  type StareArhiva,
} from "@/lib/date/arhiva";

type Incarcare =
  | { fel: "se-incarca" }
  | { fel: "eroare"; mesaj: string }
  | { fel: "gata"; stare: StareArhiva };

export default function Pagina() {
  return (
    <Suspense
      fallback={
        <Ecran>
          <AntetEcran titlu="Arhiva" />
          <ContinutEcran>
            <Panou>
              <p className="text-text-slab">Se deschide Arhiva.</p>
            </Panou>
          </ContinutEcran>
        </Ecran>
      }
    >
      <EcranArhiva />
    </Suspense>
  );
}

function EcranArhiva() {
  const cheie = cheieCursului(useSearchParams().get("curs"));
  const [incarcare, setIncarcare] = useState<Incarcare>({ fel: "se-incarca" });
  const [incarcari, reincarca] = useState(0);

  useEffect(() => {
    let anulat = false;
    (async () => {
      const stare = await stareaArhivei(cheie);
      if (!anulat) setIncarcare({ fel: "gata", stare });
    })().catch((e: unknown) => {
      if (!anulat) setIncarcare({ fel: "eroare", mesaj: mesajEroare(e) });
    });
    return () => {
      anulat = true;
    };
  }, [cheie, incarcari]);

  if (incarcare.fel === "se-incarca") {
    return (
      <Ecran>
        <AntetEcran titlu="Arhiva" />
        <ContinutEcran>
          <Panou>
            <p className="text-text-slab">Se deschide baza de date locală.</p>
          </Panou>
        </ContinutEcran>
      </Ecran>
    );
  }

  if (incarcare.fel === "eroare") {
    return (
      <Ecran>
        <AntetEcran titlu="Arhiva" />
        <ContinutEcran>
          <Panou titlu="Arhiva nu s-a deschis">
            <p className="text-text-slab">
              Baza de date din browser n-a răspuns. Progresul tău nu e afectat.
            </p>
            <p className="font-mono text-sm text-text-slab">{incarcare.mesaj}</p>
            <div>
              <Buton fel="secundar" onClick={() => reincarca((n) => n + 1)}>
                Încearcă din nou
              </Buton>
            </div>
          </Panou>
        </ContinutEcran>
        <BaraActiuni>
          <ButonLegatura href={cu("/curs/", cheie)}>Înapoi la curs</ButonLegatura>
        </BaraActiuni>
      </Ecran>
    );
  }

  const { stare } = incarcare;

  if (stare.fel === "blocata") {
    return (
      <Ecran>
        <AntetEcran
          titlu="Arhiva"
          subtitlu="Un rezumat scris din încercările tale reale — nu dintr-un model."
        />
        <ContinutEcran>
          <Panou titlu="Încă închisă">
            <p className="text-text-slab">
              Testele îți deschid Arhiva de la final. Poți sări peste, dar ea
              rămâne închisă.
            </p>
            <p className="text-text">
              {stare.total === 0
                ? "Cursul ăsta n-are teste încă."
                : `${stare.duse} din ${stare.total} teste duse.`}
            </p>
          </Panou>
        </ContinutEcran>
        <BaraActiuni>
          <ButonLegatura href={cu("/curs/", cheie)}>Înapoi la curs</ButonLegatura>
        </BaraActiuni>
      </Ecran>
    );
  }

  if (stare.fel === "goala") {
    return (
      <Ecran>
        <AntetEcran titlu="Arhiva" />
        <ContinutEcran>
          <Panou>
            <p className="text-text-slab">
              Cursul ăsta n-are încă niciun capitol de arătat aici.
            </p>
          </Panou>
        </ContinutEcran>
        <BaraActiuni>
          <ButonLegatura href={cu("/curs/", cheie)}>Înapoi la curs</ButonLegatura>
        </BaraActiuni>
      </Ecran>
    );
  }

  const { arhiva } = stare;
  const goala =
    arhiva.imprejmuiri.length === 0 &&
    arhiva.confuzii.length === 0 &&
    arhiva.dinPrima.length === 0 &&
    arhiva.provocare.length === 0;

  return (
    <Ecran>
      <AntetEcran
        titlu={`Arhiva · ${arhiva.materie}`}
        subtitlu="Un rezumat scris din încercările tale reale — nu dintr-un model."
      />
      <ContinutEcran>
        <Panou titlu="Ce ai strâns">
          <p className="text-text-slab">
            Ai terminat toate testele cursului, cu{" "}
            <strong className="text-text">{arhiva.xp} XP</strong> strânse pe
            drum.
          </p>
        </Panou>

        {goala ? (
          <Panou>
            <p className="text-text-slab">
              N-ai încercat încă niciun exercițiu — testele s-au dus fără el.
              Rezumatul se scrie din practică: din clipa în care începi, apare
              aici.
            </p>
          </Panou>
        ) : null}

        {arhiva.imprejmuiri.length > 0 ? (
          <Panou titlu="Unde te-ai împiedicat">
            <p className="text-sm text-text-slab">
              Exercițiile care ți-au luat mai multe încercări.
            </p>
            <ListaExercitii cheie={cheie} exercitii={arhiva.imprejmuiri}>
              {(e) => (e.incercari === 1 ? "o încercare" : `${e.incercari} încercări`)}
            </ListaExercitii>
          </Panou>
        ) : null}

        {arhiva.confuzii.length > 0 ? (
          <Panou titlu="Ce confuzie ai repetat">
            <p className="text-sm text-text-slab">
              Aceeași eroare, ieșită de mai multe ori la același exercițiu.
            </p>
            <ul className="flex flex-col gap-3">
              {arhiva.confuzii.map((e) => (
                <li key={e.id}>
                  <RandExercitiu cheie={cheie} exercitiu={e}>
                    {`${e.deCateOri} din câte ori: `}
                    <span className="font-mono">{e.mesaj}</span>
                  </RandExercitiu>
                </li>
              ))}
            </ul>
          </Panou>
        ) : null}

        {arhiva.dinPrima.length > 0 ? (
          <Panou titlu="Ce ai prins din prima">
            <p className="text-sm text-text-slab">
              Exerciții cu toate cazurile trecute de la prima încercare.
            </p>
            <ListaExercitii cheie={cheie} exercitii={arhiva.dinPrima}>
              {() => "din prima"}
            </ListaExercitii>
          </Panou>
        ) : null}

        {arhiva.provocare.length > 0 ? (
          <Panou titlu="Provocarea finală">
            <p className="text-sm text-text-slab">
              Câte un exercițiu din fiecare capitol — cel care ți-a luat mai
              multe încercări acolo. Se pot relua oricând; o reluare e o
              încercare nouă, ca oricare alta.
            </p>
            <ListaExercitii cheie={cheie} exercitii={arhiva.provocare}>
              {(e) => e.capitolNume}
            </ListaExercitii>
          </Panou>
        ) : null}
      </ContinutEcran>

      <BaraActiuni>
        <ButonLegatura href={cu("/curs/", cheie)}>Înapoi la curs</ButonLegatura>
        <ButonLegatura href={cu("/progres/", cheie)} fel="secundar">
          Progres
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}

function ListaExercitii({
  cheie,
  exercitii,
  children,
}: {
  cheie: CheieCurs;
  exercitii: ExercitiuArhiva[];
  children: (e: ExercitiuArhiva) => string;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {exercitii.map((e) => (
        <li key={e.id}>
          <RandExercitiu cheie={cheie} exercitiu={e}>
            {children(e)}
          </RandExercitiu>
        </li>
      ))}
    </ul>
  );
}

function RandExercitiu({
  cheie,
  exercitiu,
  children,
}: {
  cheie: CheieCurs;
  exercitiu: ExercitiuArhiva | ConfuzieArhiva;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={cu("/lectie/", cheie, { nivel: exercitiu.nivelId })}
      prefetch={false}
      className="flex min-h-11 flex-col gap-1 rounded-tema border border-contur p-4 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="text-xs uppercase tracking-wide text-text-slab">
        {exercitiu.capitolNume} · {exercitiu.nivelNume}
      </span>
      <span className="font-medium">{exercitiu.enunt}</span>
      <span className="text-sm text-text-slab">{children}</span>
    </Link>
  );
}
