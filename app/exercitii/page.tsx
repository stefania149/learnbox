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
  cazurile,
  exercitiileDemo,
  materiaDemo,
  type Exercitiu,
} from "@/lib/date/seminte";
import { citesteXpTotal, scrieIncercare } from "@/lib/date/incercari";
import { evalueaza, RABDARE_MS, type RezultatCaz } from "@/lib/exercitii/motor";
import type { SocotealaXp } from "@/lib/exercitii/xp";
import type { LinieIesire } from "@/lib/python/client";

const NUME_TIP: Record<string, string> = {
  completeaza: "Completează",
  repara: "Repară",
  scrie: "Scrie funcția",
};

type Incarcare =
  | { fel: "se-incarca" }
  | { fel: "eroare"; mesaj: string }
  | { fel: "gata"; exercitii: Exercitiu[]; materieId: number; xp: number };

type Rulare =
  | { fel: "nepornita" }
  | { fel: "ruleaza"; cazuri: RezultatCaz[] }
  | {
      fel: "gata";
      cazuri: RezultatCaz[];
      trecute: number;
      total: number;
      iesire: LinieIesire[];
      eroarePython: string | null;
      secunde: number | null;
      socoteala: SocotealaXp;
    };

export default function EcranExercitii() {
  const [incarcare, setIncarcare] = useState<Incarcare>({ fel: "se-incarca" });
  const [idAles, setIdAles] = useState<number | null>(null);
  const [cod, setCod] = useState("");
  const [rulare, setRulare] = useState<Rulare>({ fel: "nepornita" });
  const [incarcari, reincarca] = useState(0);

  useEffect(() => {
    let anulat = false;
    (async () => {
      const exercitii = await exercitiileDemo();
      const materieId = await materiaDemo();
      const xp = await citesteXpTotal(materieId);
      if (anulat) return;
      setIncarcare({ fel: "gata", exercitii, materieId, xp });
      setIdAles(exercitii[0].id);
      setCod(exercitii[0].codInitial ?? "");
    })().catch((e: unknown) => {
      if (!anulat) setIncarcare({ fel: "eroare", mesaj: mesajEroare(e) });
    });
    return () => {
      anulat = true;
    };
  }, [incarcari]);

  const exercitii = incarcare.fel === "gata" ? incarcare.exercitii : [];
  const ales = exercitii.find((e) => e.id === idAles) ?? null;

  function alege(valoare: string) {
    const nou = exercitii.find((e) => e.id === Number(valoare));
    if (!nou) return;
    setIdAles(nou.id);
    setCod(nou.codInitial ?? "");
    setRulare({ fel: "nepornita" });
  }

  async function porneste() {
    if (!ales || incarcare.fel !== "gata") return;

    setRulare({ fel: "ruleaza", cazuri: [] });

    const raport = await evalueaza(cod, cazurile(ales), (cazuri) =>
      setRulare({ fel: "ruleaza", cazuri }),
    );

    try {
      const { socoteala, xpMaterie } = await scrieIncercare({
        exercitiuId: ales.id,
        materieId: incarcare.materieId,
        cod,
        raport,
      });
      setIncarcare({ ...incarcare, xp: xpMaterie });
      setRulare({
        fel: "gata",
        cazuri: raport.cazuri,
        trecute: raport.trecute,
        total: raport.total,
        iesire: raport.iesire,
        eroarePython: raport.eroarePython,
        secunde: raport.secunde,
        socoteala,
      });
    } catch (e) {
      setIncarcare({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  const seLucreaza = rulare.fel === "ruleaza";

  return (
    <Ecran>
      <AntetEcran
        titlu="Exerciții"
        subtitlu="Codul tău rulează pe cazuri de test. Verdictul îl dau ele, nu un model."
      />
      <ContinutEcran>
        {incarcare.fel === "se-incarca" ? (
          <Panou titlu="Exercițiu">
            <p className="text-text-slab">Se deschide baza de date locală.</p>
          </Panou>
        ) : null}

        {incarcare.fel === "eroare" ? (
          <Panou titlu="Exercițiile nu s-au încărcat">
            <p className="text-text-slab">
              Baza de date din browser n-a răspuns. Exercițiile și încercările
              tale stau acolo.
            </p>
            <p className="font-mono text-sm text-text-slab">
              {incarcare.mesaj}
            </p>
            <div>
              <Buton fel="secundar" onClick={() => reincarca((n) => n + 1)}>
                Încearcă din nou
              </Buton>
            </div>
          </Panou>
        ) : null}

        {incarcare.fel === "gata" && ales ? (
          <>
            <Panou>
              <GrupAlegere
                legenda="Exercițiu"
                ajutor="Trei tipuri, în ordinea în care cer efort."
              >
                {exercitii.map((e) => (
                  <Alegere
                    key={e.id}
                    nume="exercitiu"
                    valoare={String(e.id)}
                    titlu={NUME_TIP[e.tip] ?? e.tip}
                    explicatie={e.enunt}
                    aleasa={e.id === ales.id}
                    dezactivata={seLucreaza}
                    onAlege={alege}
                  />
                ))}
              </GrupAlegere>
            </Panou>

            <Panou>
              <label htmlFor="cod" className="text-sm font-medium">
                Codul tău
              </label>
              <textarea
                id="cod"
                value={cod}
                onChange={(e) => setCod(e.target.value)}
                spellCheck={false}
                rows={10}
                className="w-full rounded-tema border border-contur bg-fundal p-4 font-mono text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              />
              <p className="text-sm text-text-slab">
                Rularea are {RABDARE_MS / 1000} secunde. Cazurile se verifică pe
                rând, iar ce a trecut până la oprire rămâne trecut.
              </p>
            </Panou>

            <Panou titlu="Cazuri de test">
              <VeziRulare
                rulare={rulare}
                cazuri={cazurile(ales)}
                explicatie={ales.explicatiePredefinita}
              />
            </Panou>

            <Panou titlu="XP">
              <p className="text-text-slab">
                Total pe cursul Python:{" "}
                <strong className="text-text">{incarcare.xp} XP</strong>. Orice
                încercare adaugă; nimic nu scade vreodată.
              </p>
            </Panou>
          </>
        ) : null}
      </ContinutEcran>

      <BaraActiuni>
        <Buton onClick={porneste} disabled={seLucreaza || !ales}>
          {seLucreaza ? "Se lucrează…" : "Rulează cazurile"}
        </Buton>
        <Buton
          fel="secundar"
          onClick={() => ales && alege(String(ales.id))}
          disabled={seLucreaza || !ales}
        >
          Începe de la codul dat
        </Buton>
        <ButonLegatura href="/" fel="secundar">
          Înapoi
        </ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}

/** Câte cazuri se văd în enunț, înainte de prima rulare (`PLAN.md` Î-11). */
const CAZURI_ARATATE = 2;

const SEMNE: Record<RezultatCaz["stare"], string> = {
  trecut: "✓",
  picat: "✗",
  eroare: "!",
  "prea-lung": "…",
  nerulat: "·",
};

function ceAIesit(caz: RezultatCaz): string {
  if (caz.stare === "trecut") return "corect";
  if (caz.stare === "picat") return `ai primit ${caz.primit}`;
  if (caz.stare === "eroare") return caz.primit ?? "eroare";
  if (caz.stare === "prea-lung") return "a durat prea mult";
  return "n-a apucat să ruleze";
}

function VeziRulare({
  rulare,
  cazuri,
  explicatie,
}: {
  rulare: Rulare;
  cazuri: { apel: string; asteptat: string }[];
  explicatie: string | null;
}) {
  if (rulare.fel === "nepornita") {
    // Î-11: se văd două ca exemple, restul apar la rulare. Altfel se scrie cod
    // croit pe cazuri, care trece testele fără să rezolve problema.
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

  const lista = (
    <ul className="flex flex-col gap-1 font-mono text-sm" aria-live="polite">
      {rulare.cazuri.map((c) => (
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

  if (rulare.fel === "ruleaza") {
    return (
      <>
        {rulare.cazuri.length > 0 ? lista : null}
        <p className="text-text-slab">
          Rulează… La prima rulare se aduce Python întreg, ~13 MB.
        </p>
      </>
    );
  }

  const toate = rulare.total > 0 && rulare.trecute === rulare.total;

  return (
    <>
      {lista}

      <p className="text-base">
        {toate
          ? "Toate cazurile trec."
          : `${rulare.trecute} din ${rulare.total} cazuri trec.`}
      </p>

      {rulare.iesire.length > 0 ? (
        <>
          <p className="text-sm text-text-slab">Ce a tipărit codul tău:</p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-tema bg-fundal p-4 font-mono text-sm">
            {rulare.iesire.map((l) => l.text).join("\n")}
          </pre>
        </>
      ) : null}

      {rulare.secunde !== null ? (
        <p className="text-text-slab">
          Codul tău a rulat {rulare.secunde} secunde și nu s-a oprit. Probabil
          ai o buclă care nu se termină — verifică dacă ceva chiar schimbă
          condiția.
        </p>
      ) : null}

      {rulare.eroarePython ? (
        <>
          <p className="text-sm text-text-slab">
            Python s-a oprit înainte de cazuri și a explicat de ce:
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-tema border border-contur p-4 font-mono text-sm">
            {rulare.eroarePython}
          </pre>
        </>
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
        {rulare.socoteala.parti.map((p) => (
          <p key={p.eticheta} className="text-sm text-text-slab">
            {p.eticheta}: +{p.xp} XP
          </p>
        ))}
        <p className="text-base">
          <strong>+{rulare.socoteala.total} XP</strong> din încercarea asta.
        </p>
      </div>
    </>
  );
}
