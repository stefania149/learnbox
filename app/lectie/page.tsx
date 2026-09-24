"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ecran,
  AntetEcran,
  ContinutEcran,
  BaraActiuni,
  Panou,
} from "@/componente/ecran";
import { Buton, ButonLegatura } from "@/componente/buton";
import { EditorCod } from "@/componente/editor-cod";
import { RaportCazuri, type StareRaport } from "@/componente/raport-cazuri";
import { RaportRubrica, type StareRaportLiber } from "@/componente/raport-rubrica";
import { ReactieZero } from "@/componente/mascota";
import { mesajEroare } from "@/lib/date/erori";
import { testulLectiei } from "@/lib/date/teste";
import {
  cheieCursului,
  cu,
  type CheieCurs,
} from "@/lib/continut/livrate";
import {
  briefingul,
  cazurile,
  limbajul,
  rubricaExercitiului,
  type EcranBriefing,
} from "@/lib/date/seminte";
import {
  citesteLectie,
  hartaCursului,
  insemneazaBriefingCitit,
  scrieProgresNivel,
  type Lectie,
} from "@/lib/date/progres";
import { citesteXpTotal, scrieIncercare } from "@/lib/date/incercari";
import { evalueaza, RABDARE_MS } from "@/lib/exercitii/motor";
import { evalueazaLiber, raportNeevaluat } from "@/lib/exercitii/evalueaza-liber";
import { faptele as faptelActive, type Fapt } from "@/lib/date/asistent";
import {
  personalizarileLectiei,
  salveazaPersonalizarea,
} from "@/lib/date/personalizare";
import { faptelePotrivite, personalizeazaEnuntul } from "@/lib/asistent/personalizeaza";
import { motorPornit } from "@/lib/rutare-model";
import { citesteSetari, type RegistruTon } from "@/lib/date/setari";

const NUME_TIP: Record<string, string> = {
  completeaza: "Completează",
  repara: "Repară",
  scrie: "Scrie funcția",
  liber: "Răspunde",
};

type Incarcare =
  | { fel: "se-incarca" }
  | { fel: "lipsa" }
  | { fel: "eroare"; mesaj: string }
  | { fel: "gata"; lectie: Lectie; xp: number };

type Faza =
  | { fel: "briefing"; ecran: number }
  | { fel: "practica"; indice: number }
  | { fel: "gata" };

export default function Pagina() {
  return (
    <Suspense
      fallback={
        <Ecran>
          <AntetEcran titlu="Lecție" />
          <ContinutEcran>
            <Panou>
              <p className="text-text-slab">Se deschide lecția.</p>
            </Panou>
          </ContinutEcran>
        </Ecran>
      }
    >
      <EcranLectie />
    </Suspense>
  );
}

function EcranLectie() {
  const router = useRouter();
  const parametri = useSearchParams();
  const nivelId = Number(parametri.get("nivel"));
  const cheie = cheieCursului(parametri.get("curs"));
  // Verificat la randare, nu în efect: un `setState` sincron într-un efect
  // pornește randări în lanț, iar aici n-avem ce sincroniza.
  const idValid = Number.isInteger(nivelId) && nivelId > 0;

  const [incarcare, setIncarcare] = useState<Incarcare>({ fel: "se-incarca" });
  const [faza, setFaza] = useState<Faza>({ fel: "briefing", ecran: 0 });
  const [coduri, setCoduri] = useState<Record<number, string>>({});
  const [rulare, setRulare] = useState<StareRaport>({ fel: "nepornita" });
  const [raspunsuriLiber, setRaspunsuriLiber] = useState<Record<number, string>>({});
  const [rulareLiber, setRulareLiber] = useState<StareRaportLiber>({ fel: "nepornita" });
  const [incercate, setIncercate] = useState<Set<number>>(new Set());
  const [urmatoarea, setUrmatoarea] = useState<{ id: number; nume: string } | null>(null);
  const [areTest, setAreTest] = useState(false);
  const [xpBriefing, setXpBriefing] = useState(0);
  const [fapte, setFapte] = useState<Fapt[]>([]);
  const [personalizari, setPersonalizari] = useState<Record<number, string>>({});
  const [arataOriginalul, setArataOriginalul] = useState<Set<number>>(new Set());
  const [sePersonalizeaza, setSePersonalizeaza] = useState<number | null>(null);
  const [ton, setTon] = useState<RegistruTon>("neutru");
  // Ce s-a încercat în vizita ASTA, nu în toate — `incercate` ține și
  // trecutul, iar zero XP (pasul 26, `PLAN.md` §8) e „a intrat, n-a atins
  // nimic, a ieșit" despre vizita curentă.
  const [incercateSesiune, setIncercateSesiune] = useState<Set<number>>(new Set());
  const [arataReactieZero, setArataReactieZero] = useState(false);

  useEffect(() => {
    let anulat = false;
    if (!idValid) return;
    (async () => {
      const lectie = await citesteLectie(nivelId, cheie);
      if (anulat) return;
      if (!lectie) {
        setIncarcare({ fel: "lipsa" });
        return;
      }
      const xp = await citesteXpTotal(lectie.materieId);
      if (anulat) return;
      setIncarcare({ fel: "gata", lectie, xp });
      setIncercate(lectie.incercate);
      setCoduri(
        Object.fromEntries(
          lectie.exercitii.map((e) => [e.id, e.codInitial ?? ""]),
        ),
      );
      // Personalizarea (pasul 23) nu ține jocul în loc: dacă baza n-a răspuns
      // încă la asta, exercițiul tot arată enunțul lui canonic.
      Promise.all([
        faptelActive(),
        personalizarileLectiei(lectie.exercitii.map((e) => e.id)),
        citesteSetari(),
      ])
        .then(([f, p, s]) => {
          if (!anulat) {
            setFapte(f);
            setPersonalizari(p);
            setTon(s.registruTon as RegistruTon);
          }
        })
        .catch(() => {});
      setFaza(
        briefingul(lectie.nivel).length > 0
          ? { fel: "briefing", ecran: 0 }
          : { fel: "practica", indice: 0 },
      );
    })().catch((e: unknown) => {
      if (!anulat) setIncarcare({ fel: "eroare", mesaj: mesajEroare(e) });
    });
    return () => {
      anulat = true;
    };
  }, [nivelId, idValid, cheie]);

  if (!idValid) return <LectieLipsa cheie={cheie} />;

  if (incarcare.fel === "se-incarca") {
    return (
      <Ecran>
        <AntetEcran titlu="Lecție" />
        <ContinutEcran>
          <Panou>
            <p className="text-text-slab">Se deschide baza de date locală.</p>
          </Panou>
        </ContinutEcran>
      </Ecran>
    );
  }

  if (incarcare.fel === "lipsa") return <LectieLipsa cheie={cheie} />;

  if (incarcare.fel === "eroare") {
    return (
      <Ecran>
        <AntetEcran titlu="Lecția nu s-a încărcat" />
        <ContinutEcran>
          <Panou>
            <p className="text-text-slab">
              Baza de date din browser n-a răspuns.
            </p>
            <p className="font-mono text-sm text-text-slab">
              {incarcare.mesaj}
            </p>
          </Panou>
        </ContinutEcran>
        <BaraActiuni>
          <ButonLegatura href={cu("/curs/", cheie)}>Înapoi la curs</ButonLegatura>
        </BaraActiuni>
      </Ecran>
    );
  }

  const { lectie } = incarcare;
  const ecrane = briefingul(lectie.nivel);
  const exercitii = lectie.exercitii;
  const seLucreaza = rulare.fel === "ruleaza";

  function mergiLa(faza: Faza) {
    setFaza(faza);
    setRulare({ fel: "nepornita" });
    setRulareLiber({ fel: "nepornita" });
    // Linia „briefingul citit" e despre ce tocmai s-a întâmplat; la al doilea
    // drum prin briefing nu se mai dă XP, deci nici nu mai are ce anunța.
    if (faza.fel === "briefing") setXpBriefing(0);
  }

  async function ruleaza(indice: number) {
    if (incarcare.fel !== "gata") return;
    const ex = exercitii[indice];
    const cod = coduri[ex.id] ?? "";

    setRulare({ fel: "ruleaza", cazuri: [] });
    const raport = await evalueaza(
      limbajul(ex),
      cod,
      cazurile(ex),
      (cazuri) => setRulare({ fel: "ruleaza", cazuri }),
    );

    try {
      const { socoteala, xpMaterie } = await scrieIncercare({
        exercitiuId: ex.id,
        materieId: lectie.materieId,
        raspuns: cod,
        verdict: raport.verdict,
        trecute: raport.trecute,
        total: raport.total,
        eroarePython: raport.eroarePython,
      });
      await scrieProgresNivel(lectie.nivel.id);
      setIncarcare({ ...incarcare, xp: xpMaterie });
      setIncercate((v) => new Set(v).add(ex.id));
      setIncercateSesiune((v) => new Set(v).add(ex.id));
      setRulare({ fel: "gata", raport, socoteala });
    } catch (e) {
      setIncarcare({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  /** Exercițiile cu răspuns liber (pasul 27, `PLAN.md` §7) — fără execuție, evaluate prin rubrică. */
  async function trimiteRaspunsul(indice: number) {
    if (incarcare.fel !== "gata") return;
    const ex = exercitii[indice];
    const raspuns = (raspunsuriLiber[ex.id] ?? "").trim();
    if (!raspuns) return;
    const rubrica = rubricaExercitiului(ex);

    setRulareLiber({ fel: "se-evalueaza" });
    const pornit = motorPornit();
    const raport = pornit
      ? await evalueazaLiber(await pornit, rubrica, raspuns).catch(() => raportNeevaluat(rubrica))
      : raportNeevaluat(rubrica);

    try {
      const { socoteala, xpMaterie } = await scrieIncercare({
        exercitiuId: ex.id,
        materieId: lectie.materieId,
        raspuns,
        verdict: raport.verdict,
        trecute: raport.trecute,
        total: raport.total,
      });
      await scrieProgresNivel(lectie.nivel.id);
      setIncarcare({ ...incarcare, xp: xpMaterie });
      setIncercate((v) => new Set(v).add(ex.id));
      setIncercateSesiune((v) => new Set(v).add(ex.id));
      setRulareLiber({ fel: "gata", raport, socoteala });
    } catch (e) {
      setIncarcare({ fel: "eroare", mesaj: mesajEroare(e) });
    }
  }

  async function personalizeaza(exercitiuId: number, enuntOriginal: string) {
    const pornit = motorPornit();
    if (!pornit) return;
    setSePersonalizeaza(exercitiuId);
    try {
      const motor = await pornit;
      const rescris = await personalizeazaEnuntul(motor, enuntOriginal, fapte);
      if (rescris) {
        await salveazaPersonalizarea(exercitiuId, rescris);
        setPersonalizari((v) => ({ ...v, [exercitiuId]: rescris }));
      }
    } catch {
      // Personalizarea e un adaos: dacă n-a mers, exercițiul rămâne cu enunțul lui.
    } finally {
      setSePersonalizeaza(null);
    }
  }

  async function incepePractica() {
    mergiLa({ fel: "practica", indice: 0 });
    if (incarcare.fel !== "gata") return;
    try {
      const dat = await insemneazaBriefingCitit(
        lectie.nivel.id,
        lectie.materieId,
      );
      if (dat > 0) {
        setXpBriefing(dat);
        setIncarcare((v) =>
          v.fel === "gata" ? { ...v, xp: v.xp + dat } : v,
        );
      }
    } catch {
      // XP-ul de briefing nu merită să strice lecția dacă nu s-a putut scrie.
    }
  }

  // Zero XP (pasul 26, `PLAN.md` §8): dacă vizita asta n-a adus nici XP de
  // briefing, nici o încercare, mascota reacționează înainte să pleci — nu
  // te oprește, doar oferă un exercițiu ușor ca alternativă.
  function iesiDinLectie() {
    if (incercateSesiune.size === 0 && xpBriefing === 0) {
      setArataReactieZero(true);
      return;
    }
    router.push(cu("/curs/", cheie));
  }

  async function terminaLectia() {
    mergiLa({ fel: "gata" });
    try {
      const harta = await hartaCursului(cheie);
      const deschisa = harta.capitole
        .flatMap((c) => c.niveluri)
        .find((n) => n.stare === "deschis" && n.id !== lectie.nivel.id);
      setUrmatoarea(deschisa ? { id: deschisa.id, nume: deschisa.nume } : null);
      setAreTest((await testulLectiei(lectie.nivel.id, cheie)) !== null);
    } catch {
      setUrmatoarea(null);
    }
  }

  const titlu = `Lecția ${lectie.nivel.ordine} · ${lectie.nivel.nume}`;

  if (arataReactieZero) {
    return (
      <Ecran>
        <AntetEcran titlu={titlu} />
        <ContinutEcran>
          <ReactieZero
            ton={ton}
            onIncearca={() => {
              setArataReactieZero(false);
              mergiLa({ fel: "practica", indice: 0 });
            }}
            onIesi={() => router.push(cu("/curs/", cheie))}
          />
        </ContinutEcran>
      </Ecran>
    );
  }

  if (faza.fel === "briefing") {
    const ecran = ecrane[faza.ecran];
    const ultimul = faza.ecran === ecrane.length - 1;
    return (
      <Ecran>
        <AntetEcran
          titlu={titlu}
          subtitlu={`Briefing · ${faza.ecran + 1} din ${ecrane.length}`}
        />
        <ContinutEcran>
          <VeziBriefing ecran={ecran} />
        </ContinutEcran>
        <BaraActiuni>
          {ultimul ? (
            <Buton onClick={incepePractica}>Începe practica</Buton>
          ) : (
            <Buton
              onClick={() => mergiLa({ fel: "briefing", ecran: faza.ecran + 1 })}
            >
              Mai departe
            </Buton>
          )}
          {faza.ecran > 0 ? (
            <Buton
              fel="secundar"
              onClick={() => mergiLa({ fel: "briefing", ecran: faza.ecran - 1 })}
            >
              Ecranul dinainte
            </Buton>
          ) : null}
          <Buton fel="secundar" onClick={iesiDinLectie}>
            Înapoi la curs
          </Buton>
        </BaraActiuni>
      </Ecran>
    );
  }

  if (faza.fel === "practica") {
    const ex = exercitii[faza.indice];
    const ultimul = faza.indice === exercitii.length - 1;
    const aFostIncercat = incercate.has(ex.id);
    const esteLiber = ex.tip === "liber";
    const seLucreazaLiber = rulareLiber.fel === "se-evalueaza";
    const ocupat = esteLiber ? seLucreazaLiber : seLucreaza;

    return (
      <Ecran>
        <AntetEcran
          titlu={titlu}
          subtitlu={`Practică · exercițiul ${faza.indice + 1} din ${exercitii.length}`}
        />
        <ContinutEcran>
          <Panou titlu={NUME_TIP[ex.tip] ?? ex.tip}>
            <p>
              {personalizari[ex.id] && !arataOriginalul.has(ex.id)
                ? personalizari[ex.id]
                : ex.enunt}
            </p>
            {personalizari[ex.id] ? (
              <>
                <p className="text-xs text-accent">Personalizat din memorie</p>
                <div>
                  <Buton
                    fel="secundar"
                    onClick={() =>
                      setArataOriginalul((v) => {
                        const nou = new Set(v);
                        if (nou.has(ex.id)) nou.delete(ex.id);
                        else nou.add(ex.id);
                        return nou;
                      })
                    }
                  >
                    {arataOriginalul.has(ex.id) ? "Arată personalizarea" : "Arată enunțul original"}
                  </Buton>
                </div>
              </>
            ) : motorPornit() && faptelePotrivite(fapte).length > 0 ? (
              <div>
                <Buton
                  fel="secundar"
                  onClick={() => void personalizeaza(ex.id, ex.enunt)}
                  disabled={sePersonalizeaza === ex.id}
                >
                  {sePersonalizeaza === ex.id ? "Se personalizează…" : "Personalizează din memorie"}
                </Buton>
              </div>
            ) : null}
          </Panou>

          {esteLiber ? (
            <Panou>
              <label
                htmlFor="raspuns-liber"
                className="flex flex-col gap-2 text-sm text-text-slab"
              >
                Răspunsul tău
                <textarea
                  id="raspuns-liber"
                  value={raspunsuriLiber[ex.id] ?? ""}
                  onChange={(e) =>
                    setRaspunsuriLiber((v) => ({ ...v, [ex.id]: e.target.value }))
                  }
                  disabled={ocupat}
                  rows={6}
                  placeholder="Scrie răspunsul aici…"
                  className="min-h-32 resize-none rounded-tema border border-contur bg-suprafata p-3 font-mono text-sm text-text placeholder:text-text-slab focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                />
              </label>
            </Panou>
          ) : (
            <Panou>
              <EditorCod
                eticheta="Codul tău"
                limbaj={limbajul(ex)}
                valoare={coduri[ex.id] ?? ""}
                onSchimba={(cod) =>
                  setCoduri((v) => ({ ...v, [ex.id]: cod }))
                }
                dezactivat={ocupat}
                ajutor={`Rularea are ${RABDARE_MS / 1000} secunde. Cazurile se verifică pe rând, iar ce a trecut până la oprire rămâne trecut. Tab te scoate din editor; indentarea se face cu spații.`}
              />
            </Panou>
          )}

          <Panou titlu={esteLiber ? "Evaluare" : "Cazuri de test"}>
            {esteLiber ? (
              <RaportRubrica
                stare={rulareLiber}
                rubrica={rubricaExercitiului(ex)}
                explicatie={ex.explicatiePredefinita}
              />
            ) : (
              <RaportCazuri
                stare={rulare}
                cazuri={cazurile(ex)}
                limbaj={limbajul(ex)}
                explicatie={ex.explicatiePredefinita}
              />
            )}
          </Panou>

          <Panou titlu="XP">
            {xpBriefing > 0 ? (
              <p className="text-text-slab">
                Briefingul citit: <strong className="text-text">+{xpBriefing} XP</strong>.
              </p>
            ) : null}
            <p className="text-text-slab">
              Ai strâns{" "}
              <strong className="text-text">{incarcare.xp} XP</strong> pe
              cursul ăsta. Orice încercare adaugă; nimic nu scade vreodată.
            </p>
          </Panou>
        </ContinutEcran>

        <BaraActiuni>
          {esteLiber ? (
            <Buton
              onClick={() => trimiteRaspunsul(faza.indice)}
              disabled={ocupat || !(raspunsuriLiber[ex.id] ?? "").trim()}
            >
              {ocupat ? "Se citește…" : "Trimite răspunsul"}
            </Buton>
          ) : (
            <Buton onClick={() => ruleaza(faza.indice)} disabled={ocupat}>
              {ocupat ? "Se lucrează…" : "Rulează cazurile"}
            </Buton>
          )}

          {ultimul ? (
            <Buton
              fel="secundar"
              onClick={terminaLectia}
              disabled={ocupat || !aFostIncercat}
            >
              Termină lecția
            </Buton>
          ) : (
            <Buton
              fel="secundar"
              onClick={() =>
                mergiLa({ fel: "practica", indice: faza.indice + 1 })
              }
              disabled={ocupat || !aFostIncercat}
            >
              Exercițiul următor
            </Buton>
          )}

          {faza.indice > 0 ? (
            <Buton
              fel="secundar"
              onClick={() =>
                mergiLa({ fel: "practica", indice: faza.indice - 1 })
              }
              disabled={ocupat}
            >
              Exercițiul dinainte
            </Buton>
          ) : (
            <Buton
              fel="secundar"
              onClick={() =>
                mergiLa({ fel: "briefing", ecran: Math.max(ecrane.length - 1, 0) })
              }
              disabled={ocupat || ecrane.length === 0}
            >
              Înapoi la briefing
            </Buton>
          )}

          <Buton fel="secundar" onClick={iesiDinLectie}>
            Înapoi la curs
          </Buton>
        </BaraActiuni>
      </Ecran>
    );
  }

  const toateIncercate = exercitii.every((e) => incercate.has(e.id));

  return (
    <Ecran>
      <AntetEcran titlu={titlu} subtitlu="Lecția s-a încheiat." />
      <ContinutEcran>
        <Panou titlu="Ce ai făcut">
          <p className="text-text-slab">
            Ai încercat {exercitii.filter((e) => incercate.has(e.id)).length}{" "}
            din {exercitii.length} exerciții.
          </p>
          <p className="text-text-slab">
            {!toateIncercate
              ? "Lecția rămâne deschisă. Se termină când ai încercat fiecare exercițiu — nu când le nimerești pe toate."
              : urmatoarea
                ? "Lecția e terminată și următoarea s-a deschis. Poți să te întorci oricând la exercițiile de aici — fiecare reluare se scrie ca încercare nouă."
                : "Ai încercat tot ce are capitolul ăsta. Poți să te întorci oricând la orice exercițiu — fiecare reluare se scrie ca încercare nouă."}
          </p>
        </Panou>

        <Panou titlu="XP">
          <p className="text-text-slab">
            Ai strâns <strong className="text-text">{incarcare.xp} XP</strong>{" "}
            pe cursul ăsta.
          </p>
        </Panou>
      </ContinutEcran>

      <BaraActiuni>
        {areTest ? (
          <ButonLegatura
            href={cu("/test/", cheie, { nivel: lectie.nivel.id })}
            prefetch={false}
          >
            Dă testul lecției
          </ButonLegatura>
        ) : null}
        {urmatoarea ? (
          <ButonLegatura
            href={cu("/lectie/", cheie, { nivel: urmatoarea.id })}
            prefetch={false}
            fel={areTest ? "secundar" : "principal"}
          >
            Lecția următoare: {urmatoarea.nume}
          </ButonLegatura>
        ) : null}
        <ButonLegatura href={cu("/curs/", cheie)} fel="secundar">
          Înapoi la curs
        </ButonLegatura>
        <ButonLegatura href={cu("/progres/", cheie)} fel="secundar">
          Vezi progresul
        </ButonLegatura>
        <Buton
          fel="secundar"
          onClick={() => mergiLa({ fel: "practica", indice: 0 })}
        >
          Reia exercițiile
        </Buton>
      </BaraActiuni>
    </Ecran>
  );
}

function LectieLipsa({ cheie }: { cheie: CheieCurs }) {
  return (
    <Ecran>
      <AntetEcran
        titlu="Lecția asta nu există"
        subtitlu="Ori linkul e vechi, ori s-a schimbat cursul."
      />
      <ContinutEcran>
        <Panou>
          <p className="text-text-slab">
            Progresul tău nu e afectat — el stă în browser, nu în adresa asta.
          </p>
        </Panou>
      </ContinutEcran>
      <BaraActiuni>
        <ButonLegatura href={cu("/curs/", cheie)}>Înapoi la curs</ButonLegatura>
      </BaraActiuni>
    </Ecran>
  );
}

function VeziBriefing({ ecran }: { ecran: EcranBriefing }) {
  return (
    <Panou>
      {/* Titlu de propoziție, nu eticheta cu majuscule a panoului: aici e o
          frază întreagă, nu un nume de secțiune. */}
      <h2 className="text-xl font-semibold tracking-tight">{ecran.titlu}</h2>
      <p>{ecran.text}</p>
      {ecran.cod ? (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-tema bg-fundal p-4 font-mono text-sm">
          {ecran.cod}
        </pre>
      ) : null}
    </Panou>
  );
}
