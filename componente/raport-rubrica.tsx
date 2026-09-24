"use client";

import type { ItemRubrica, RaportLiber } from "@/lib/exercitii/evalueaza-liber";
import type { SocotealaXp } from "@/lib/exercitii/xp";

export type StareRaportLiber =
  | { fel: "nepornita" }
  | { fel: "se-evalueaza" }
  | { fel: "gata"; raport: RaportLiber; socoteala: SocotealaXp };

function Lista({ itemi }: { itemi: ItemRubrica[] }) {
  return (
    <ul className="flex flex-col gap-1 text-sm" aria-live="polite">
      {itemi.map((it) => (
        <li key={it.criteriu} className={it.indeplinit ? "text-text" : "text-text-slab"}>
          <span aria-hidden="true">{it.indeplinit ? "✓" : "·"} </span>
          {it.criteriu}
        </li>
      ))}
    </ul>
  );
}

function SocotealaXpVazuta({ socoteala }: { socoteala: SocotealaXp }) {
  return (
    <div className="flex flex-col gap-1 border-t border-contur pt-4">
      {socoteala.parti.map((p) => (
        <p key={p.eticheta} className="text-sm text-text-slab">
          {p.eticheta}: +{p.xp} XP
        </p>
      ))}
      <p className="text-base">
        <strong>+{socoteala.total} XP</strong> din încercarea asta.
      </p>
    </div>
  );
}

/**
 * Raportul unui exercițiu cu răspuns liber (pasul 27) — puncte de rubrică
 * atinse, nu cazuri de test. Rubrica nu se arată dinainte de răspuns: altfel
 * exercițiul devine „completează golurile din listă", nu un răspuns adevărat.
 */
export function RaportRubrica({
  stare,
  rubrica,
  explicatie,
}: {
  stare: StareRaportLiber;
  rubrica: string[];
  explicatie?: string | null;
}) {
  if (stare.fel === "nepornita") {
    return (
      <p className="text-text-slab">
        Răspunsul tău se citește față de {rubrica.length}{" "}
        {rubrica.length === 1 ? "punct" : "puncte"} — nu se arată dinainte.
      </p>
    );
  }

  if (stare.fel === "se-evalueaza") {
    return <p className="text-text-slab">Se citește răspunsul…</p>;
  }

  const { raport, socoteala } = stare;

  if (raport.verdict === "neevaluat") {
    return (
      <>
        <p className="text-text-slab">
          Răspunsul s-a păstrat, dar n-a putut fi citit acum — evaluarea are
          nevoie de modelul din browser (pornit din „Asistent”). Poți reveni
          oricând la exercițiul ăsta.
        </p>
        <SocotealaXpVazuta socoteala={socoteala} />
      </>
    );
  }

  const toate = raport.total > 0 && raport.trecute === raport.total;

  return (
    <>
      <Lista itemi={raport.itemi} />

      <p className="text-base">
        {toate
          ? "Toate punctele sunt atinse."
          : `${raport.trecute} din ${raport.total} puncte sunt atinse.`}
      </p>

      {!toate && explicatie ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Aici se greșește de obicei</p>
          <p className="text-text-slab">{explicatie}</p>
        </div>
      ) : null}

      <SocotealaXpVazuta socoteala={socoteala} />
    </>
  );
}
