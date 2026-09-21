"use client";

import { useEffect, useState } from "react";
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
import {
  bonusDeRevenire,
  hartaCursului,
  type Harta,
  type NivelHarta,
} from "@/lib/date/progres";

type Stare =
  | { fel: "se-incarca" }
  | { fel: "gata"; harta: Harta }
  | { fel: "eroare"; mesaj: string };

export default function EcranCurs() {
  const [stare, setStare] = useState<Stare>({ fel: "se-incarca" });
  const [incarcari, reincarca] = useState(0);

  useEffect(() => {
    let anulat = false;
    (async () => {
      const harta = await hartaCursului();
      // Bonusul de revenire se dă tăcut (`PLAN.md` §8): se adaugă la total și
      // atât, fără mesaj și fără sărbătoare.
      await bonusDeRevenire(harta.materieId).catch(() => 0);
      const proaspata = await hartaCursului();
      if (!anulat) setStare({ fel: "gata", harta: proaspata });
    })().catch((e: unknown) => {
      if (!anulat) setStare({ fel: "eroare", mesaj: mesajEroare(e) });
    });
    return () => {
      anulat = true;
    };
  }, [incarcari]);

  const urmatoarea =
    stare.fel === "gata"
      ? stare.harta.capitole
          .flatMap((c) => c.niveluri)
          .find((n) => n.stare === "deschis")
      : undefined;

  return (
    <Ecran>
      <AntetEcran
        titlu={stare.fel === "gata" ? stare.harta.materie : "Curs"}
        subtitlu="Capitole, lecții, și unde ai ajuns. Totul stă pe calculatorul tău."
      />
      <ContinutEcran>
        {stare.fel === "se-incarca" ? (
          <Panou titlu="Capitole">
            <p className="text-text-slab">Se deschide baza de date locală.</p>
          </Panou>
        ) : null}

        {stare.fel === "eroare" ? (
          <Panou titlu="Cursul nu s-a încărcat">
            <p className="text-text-slab">
              Baza de date din browser n-a răspuns. Lecțiile și progresul tău
              stau acolo.
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
          <>
            {stare.harta.capitole.map((c) => (
              <Panou key={c.id} titlu={`Capitolul ${c.ordine} · ${c.nume}`}>
                <ul className="flex flex-col gap-3">
                  {c.niveluri.map((n) => (
                    <li key={n.id}>
                      <RandLectie nivel={n} />
                    </li>
                  ))}
                </ul>
              </Panou>
            ))}

            <Panou titlu="XP">
              <p className="text-text-slab">
                Ai strâns{" "}
                <strong className="text-text">{stare.harta.xp} XP</strong> pe
                cursul ăsta. Orice încercare adaugă; nimic nu scade vreodată.
              </p>
            </Panou>
          </>
        ) : null}
      </ContinutEcran>

      <BaraActiuni>
        {urmatoarea ? (
          <ButonLegatura
            href={`/lectie/?nivel=${urmatoarea.id}`}
            prefetch={false}
          >
            Continuă: {urmatoarea.nume}
          </ButonLegatura>
        ) : null}
        <ButonLegatura href="/progres/" fel="secundar">
          Progres
        </ButonLegatura>
        <ButonLegatura href="/python/" fel="secundar">
          Scrie cod liber
        </ButonLegatura>
        <ButonLegatura href="/" fel="secundar">
          Înapoi
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}

const ETICHETE = {
  terminat: "Terminată",
  deschis: "Deschisă",
  blocat: "Se deschide mai încolo",
} as const;

function RandLectie({ nivel }: { nivel: NivelHarta }) {
  const blocat = nivel.stare === "blocat";

  const continut = (
    <>
      <span className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-slab">
          Lecția {nivel.ordine} · {ETICHETE[nivel.stare]}
        </span>
        <span className="font-medium">{nivel.nume}</span>
        <span className="text-sm text-text-slab">
          {blocat
            ? "Se deschide când termini lecția dinainte."
            : `${nivel.incercate} din ${nivel.exercitii} exerciții încercate · ${nivel.xp} XP`}
        </span>
      </span>
      {!blocat ? (
        <span aria-hidden="true" className="text-text-slab">
          →
        </span>
      ) : null}
    </>
  );

  const stil =
    "flex min-h-11 items-center justify-between gap-4 rounded-tema border p-4";

  if (blocat) {
    return (
      <div className={`${stil} border-contur opacity-70`}>{continut}</div>
    );
  }

  return (
    <Link
      href={`/lectie/?nivel=${nivel.id}`}
      // Exportul static n-are o bucată pregătită pentru adresa cu parametru,
      // iar preîncărcarea ar cere una inexistentă și ar umple consola cu 404.
      prefetch={false}
      className={`${stil} transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        nivel.stare === "terminat"
          ? "border-accent"
          : "border-contur hover:border-accent"
      }`}
    >
      {continut}
    </Link>
  );
}
