"use client";

import { Consola, MesajCronometru, Traceback } from "@/componente/consola";
import type { CazTest, Raport, RezultatCaz } from "@/lib/exercitii/motor";
import type { SocotealaXp } from "@/lib/exercitii/xp";

/** Câte cazuri se văd în enunț, înainte de prima rulare (`PLAN.md` Î-11). */
const CAZURI_ARATATE = 2;

const SEMNE: Record<RezultatCaz["stare"], string> = {
  trecut: "✓",
  picat: "✗",
  eroare: "!",
  "prea-lung": "…",
  nerulat: "·",
};

export type StareRaport =
  | { fel: "nepornita" }
  | { fel: "ruleaza"; cazuri: RezultatCaz[] }
  | { fel: "gata"; raport: Raport; socoteala: SocotealaXp };

function ceAIesit(caz: RezultatCaz): string {
  if (caz.stare === "trecut") return "corect";
  if (caz.stare === "picat") return `ai primit ${caz.primit}`;
  if (caz.stare === "eroare") return caz.primit ?? "eroare";
  if (caz.stare === "prea-lung") return "a durat prea mult";
  return "n-a apucat să ruleze";
}

function Lista({ cazuri }: { cazuri: RezultatCaz[] }) {
  return (
    <ul className="flex flex-col gap-1 font-mono text-sm" aria-live="polite">
      {cazuri.map((c) => (
        <li
          key={c.apel}
          className={
            c.stare === "trecut"
              ? "text-text"
              : c.stare === "nerulat"
                ? "text-text-slab opacity-70"
                : "text-text-slab"
          }
        >
          <span aria-hidden="true">{SEMNE[c.stare]} </span>
          {c.apel} → {c.asteptat}
          <span className="pl-2">{ceAIesit(c)}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Raportul „3 din 5" (`PLAN.md` §7). Arată cât a reușit, nu cât a greșit, și
 * nu scrie nicăieri un număr care scade (regula 4).
 */
export function RaportCazuri({
  stare,
  cazuri,
  explicatie,
}: {
  stare: StareRaport;
  /** Cazurile declarate ale exercițiului, pentru ecranul de dinainte de rulare. */
  cazuri: CazTest[];
  explicatie?: string | null;
}) {
  if (stare.fel === "nepornita") {
    const ascunse = cazuri.length - CAZURI_ARATATE;
    return (
      <>
        <p className="text-text-slab">
          {cazuri.length} cazuri așteaptă. Două se văd de pe acum, ca exemple.
        </p>
        <ul className="flex flex-col gap-1 font-mono text-sm text-text-slab">
          {cazuri.slice(0, CAZURI_ARATATE).map((c) => (
            <li key={c.apel}>
              {c.apel} → {c.asteptat}
            </li>
          ))}
        </ul>
        {ascunse > 0 ? (
          <p className="text-sm text-text-slab">
            Încă {ascunse} {ascunse === 1 ? "caz apare" : "cazuri apar"} la
            prima rulare.
          </p>
        ) : null}
      </>
    );
  }

  if (stare.fel === "ruleaza") {
    return (
      <>
        {stare.cazuri.length > 0 ? <Lista cazuri={stare.cazuri} /> : null}
        <p className="text-text-slab">
          Rulează… La prima rulare se aduce Python întreg, ~13 MB.
        </p>
      </>
    );
  }

  const { raport, socoteala } = stare;
  const toate = raport.total > 0 && raport.trecute === raport.total;

  return (
    <>
      <Lista cazuri={raport.cazuri} />

      <p className="text-base">
        {toate
          ? "Toate cazurile trec."
          : `${raport.trecute} din ${raport.total} cazuri trec.`}
      </p>

      {raport.iesire.length > 0 ? (
        <>
          <p className="text-sm text-text-slab">Ce a tipărit codul tău:</p>
          <Consola iesire={raport.iesire} />
        </>
      ) : null}

      {raport.secunde !== null ? (
        <MesajCronometru secunde={raport.secunde} />
      ) : null}

      {raport.eroarePython ? (
        <Traceback
          text={raport.eroarePython}
          titlu="Python s-a oprit înainte de cazuri și a explicat de ce:"
        />
      ) : null}

      {!toate && explicatie ? (
        <div className="flex flex-col gap-2">
          {/* Scrisă odată cu exercițiul: fără ea, cine n-are model n-ar primi
              niciun răspuns util (`PLAN.md` §11). */}
          <p className="text-sm font-medium">Aici se greșește de obicei</p>
          <p className="text-text-slab">{explicatie}</p>
        </div>
      ) : null}

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
    </>
  );
}
