"use client";

/*
 * Testul unei lecții sau al unui capitol — pasul 14.
 *
 * O întrebare pe ecran, variante de ales, și explicația după ce ai răspuns —
 * și când ai nimerit, și când n-ai nimerit. Verdictul se dă comparând numere,
 * fără niciun model (principiul 1).
 *
 * Nu se poate pica. La capăt scrie câte ai nimerit și cât XP ai luat; nu apare
 * nicio notă, niciun „ai greșit", și nimic nu scade (principiul 6, regula 4).
 */

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
import { cheieCursului, cu, type CheieCurs } from "@/lib/continut/livrate";
import {
  scrieIncercareTest,
  testulCapitolului,
  testulLectiei,
  type RaportTest,
  type Raspunsuri,
  type TestDeschis,
} from "@/lib/date/teste";

type Incarcare =
  | { fel: "se-incarca" }
  | { fel: "lipsa" }
  | { fel: "gata"; testul: TestDeschis }
  | { fel: "eroare"; mesaj: string };

type Faza =
  | { fel: "raspunde"; indice: number }
  | { fel: "gata"; raport: RaportTest };

export default function Pagina() {
  return (
    <Suspense
      fallback={
        <Ecran>
          <AntetEcran titlu="Test" />
          <ContinutEcran>
            <Panou>
              <p className="text-text-slab">Se deschide testul.</p>
            </Panou>
          </ContinutEcran>
        </Ecran>
      }
    >
      <EcranTest />
    </Suspense>
  );
}

function EcranTest() {
  const parametri = useSearchParams();
  const cheie = cheieCursului(parametri.get("curs"));
  const nivelId = Number(parametri.get("nivel"));
  const capitolId = Number(parametri.get("capitol"));
  const areNivel = Number.isInteger(nivelId) && nivelId > 0;
  const areCapitol = Number.isInteger(capitolId) && capitolId > 0;

  const [incarcare, setIncarcare] = useState<Incarcare>({ fel: "se-incarca" });
  const [faza, setFaza] = useState<Faza>({ fel: "raspunde", indice: 0 });
  const [raspunsuri, setRaspunsuri] = useState<Raspunsuri>([]);
  const [aratExplicatia, setAratExplicatia] = useState(false);
  const [seScrie, setSeScrie] = useState(false);

  useEffect(() => {
    let anulat = false;
    (async () => {
      if (!areNivel && !areCapitol) {
        if (!anulat) setIncarcare({ fel: "lipsa" });
        return;
      }
      const testul = areNivel
        ? await testulLectiei(nivelId, cheie)
        : await testulCapitolului(capitolId, cheie);
      if (anulat) return;
      if (!testul) {
        setIncarcare({ fel: "lipsa" });
        return;
      }
      setRaspunsuri(testul.intrebari.map(() => null));
      setIncarcare({ fel: "gata", testul });
    })().catch((e: unknown) => {
      if (!anulat) setIncarcare({ fel: "eroare", mesaj: mesajEroare(e) });
    });
    return () => {
      anulat = true;
    };
  }, [nivelId, capitolId, areNivel, areCapitol, cheie]);

  if (incarcare.fel === "se-incarca") {
    return (
      <Ecran>
        <AntetEcran titlu="Test" />
        <ContinutEcran>
          <Panou>
            <p className="text-text-slab">Se deschide testul.</p>
          </Panou>
        </ContinutEcran>
      </Ecran>
    );
  }

  if (incarcare.fel === "lipsa") return <TestLipsa cheie={cheie} />;

  if (incarcare.fel === "eroare") {
    return (
      <Ecran>
        <AntetEcran titlu="Test" />
        <ContinutEcran>
          <Panou titlu="Testul nu s-a deschis">
            <p className="text-text-slab">
              Baza de date din browser n-a răspuns. Nimic din ce ai făcut nu e
              afectat.
            </p>
            <p className="font-mono text-sm text-text-slab">{incarcare.mesaj}</p>
          </Panou>
        </ContinutEcran>
        <BaraActiuni>
          <ButonLegatura href={cu("/curs/", cheie)}>Înapoi la curs</ButonLegatura>
        </BaraActiuni>
      </Ecran>
    );
  }

  const { testul } = incarcare;

  if (faza.fel === "gata") {
    return (
      <Rezultatul
        testul={testul}
        raport={faza.raport}
        cheie={cheie}
        nivelId={areNivel ? nivelId : null}
        reia={() => {
          setRaspunsuri(testul.intrebari.map(() => null));
          setAratExplicatia(false);
          setFaza({ fel: "raspunde", indice: 0 });
        }}
      />
    );
  }

  const indice = faza.indice;
  const intrebare = testul.intrebari[indice];
  const ales = raspunsuri[indice];
  const ultima = indice === testul.intrebari.length - 1;

  async function mergiMaiDeparte() {
    if (!aratExplicatia) {
      setAratExplicatia(true);
      return;
    }
    if (!ultima) {
      setAratExplicatia(false);
      setFaza({ fel: "raspunde", indice: indice + 1 });
      return;
    }
    setSeScrie(true);
    try {
      const raport = await scrieIncercareTest({ testul, raspunsuri });
      setFaza({ fel: "gata", raport });
    } catch (e) {
      setIncarcare({ fel: "eroare", mesaj: mesajEroare(e) });
    } finally {
      setSeScrie(false);
    }
  }

  return (
    <Ecran>
      <AntetEcran
        titlu={testul.titlu}
        subtitlu={`Întrebarea ${indice + 1} din ${testul.intrebari.length} · se poate lăsa oricând, nu blochează nimic`}
      />
      <ContinutEcran>
        <Panou titlu={`Întrebarea ${indice + 1}`}>
          <p>{intrebare.intrebare}</p>

          <ul className="flex flex-col gap-2">
            {intrebare.variante.map((varianta, i) => (
              <li key={varianta}>
                <BifaVarianta
                  varianta={varianta}
                  aleasa={ales === i}
                  arataAdevarul={aratExplicatia}
                  esteCorecta={i === intrebare.corect}
                  dezactivat={aratExplicatia}
                  onAlege={() =>
                    setRaspunsuri((v) =>
                      v.map((r, k) => (k === indice ? i : r)),
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </Panou>

        {aratExplicatia ? (
          <Panou titlu={ales === intrebare.corect ? "Așa e" : "Cum stă treaba"}>
            <p className="text-text-slab">{intrebare.explicatie}</p>
          </Panou>
        ) : null}
      </ContinutEcran>

      <BaraActiuni>
        <Buton
          onClick={() => void mergiMaiDeparte()}
          disabled={ales === null || seScrie}
        >
          {!aratExplicatia
            ? "Răspunde"
            : ultima
              ? seScrie
                ? "Se scrie…"
                : "Termină testul"
              : "Întrebarea următoare"}
        </Buton>
        <ButonLegatura href={cu("/curs/", cheie)} fel="secundar">
          Lasă testul
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}

function BifaVarianta({
  varianta,
  aleasa,
  arataAdevarul,
  esteCorecta,
  dezactivat,
  onAlege,
}: {
  varianta: string;
  aleasa: boolean;
  arataAdevarul: boolean;
  esteCorecta: boolean;
  dezactivat: boolean;
  onAlege: () => void;
}) {
  // După răspuns se arată care era bună. Cea greșit aleasă nu se înroșește și
  // nu primește niciun semn de mustrare — doar nu e cea însemnată.
  const insemnata = arataAdevarul && esteCorecta;
  const contur = insemnata
    ? "border-accent"
    : aleasa
      ? "border-text-slab"
      : "border-contur";

  return (
    <button
      type="button"
      onClick={onAlege}
      disabled={dezactivat}
      aria-pressed={aleasa}
      className={`flex min-h-11 w-full items-center gap-3 rounded-tema border ${contur} p-3 text-left transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:hover:border-inherit`}
    >
      <span
        aria-hidden
        className={insemnata || aleasa ? "text-accent" : "text-text-slab"}
      >
        {insemnata ? "✓" : aleasa ? "▸" : "·"}
      </span>
      <span className="flex-1">{varianta}</span>
    </button>
  );
}

function Rezultatul({
  testul,
  raport,
  cheie,
  nivelId,
  reia,
}: {
  testul: TestDeschis;
  raport: RaportTest;
  cheie: CheieCurs;
  nivelId: number | null;
  reia: () => void;
}) {
  return (
    <Ecran>
      <AntetEcran
        titlu={testul.titlu}
        subtitlu="Testul e dus până la capăt. Se poate relua oricând."
      />
      <ContinutEcran>
        <Panou titlu="Cum a ieșit">
          <p className="text-2xl text-accent">
            {raport.corecte} din {raport.total}
          </p>
          <p className="text-text-slab">
            {raport.corecte === raport.total
              ? "Toate întrebările au răspunsul bun."
              : "Explicațiile de la fiecare întrebare rămân valabile: reia testul când vrei, de câte ori vrei."}
          </p>
        </Panou>

        <Panou titlu="XP">
          {raport.socoteala.parti.map((p) => (
            <p key={p.eticheta} className="text-sm text-text-slab">
              {p.eticheta}: +{p.xp} XP.
            </p>
          ))}
          <p className="text-text">
            +{raport.socoteala.total} XP din testul ăsta. Ai strâns{" "}
            <strong>{raport.xpMaterie} XP</strong> pe curs.
          </p>
        </Panou>
      </ContinutEcran>

      <BaraActiuni>
        <ButonLegatura href={cu("/curs/", cheie)}>Înapoi la curs</ButonLegatura>
        <Buton fel="secundar" onClick={reia}>
          Reia testul
        </Buton>
        {nivelId !== null ? (
          <ButonLegatura
            href={cu("/lectie/", cheie, { nivel: nivelId })}
            fel="secundar"
          >
            Înapoi la lecție
          </ButonLegatura>
        ) : null}
      </BaraActiuni>
    </Ecran>
  );
}

function TestLipsa({ cheie }: { cheie: CheieCurs }) {
  return (
    <Ecran>
      <AntetEcran
        titlu="Testul ăsta nu există"
        subtitlu="Ori linkul e vechi, ori lecția n-are test."
      />
      <ContinutEcran>
        <Panou>
          <p className="text-text-slab">
            Nu orice lecție are test. Practica e cea care deschide lecția
            următoare; testul vine peste ea, când există.
          </p>
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        <ButonLegatura href={cu("/curs/", cheie)}>Înapoi la curs</ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}
