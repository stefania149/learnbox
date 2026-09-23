/**
 * Personalizarea unui exercițiu din memorie — pasul 23 (`PLAN.md` §9: „Dacă
 * ești la Economie, exemplele lucrează cu facturi și prețuri, nu cu
 * animale").
 *
 * Modelul rescrie doar povestea din jurul exercițiului — numele obiectelor,
 * domeniul. Ce trebuie calculat rămâne neatins: cazurile de test și soluția
 * nu se ating aici (regula 1), deci un enunț rescris prost strică lectura,
 * nu verdictul.
 */
import type { MLCEngineInterface } from "@mlc-ai/web-llm";
import type { Fapt } from "@/lib/date/asistent";
import { ruleazaPeModel } from "@/lib/rutare-model";

const TIPURI_RELEVANTE = new Set(["facultate", "materie_facuta", "exemplu_clar"]);

/** Faptele care ajută la personalizarea unui exercițiu — restul nu au legătură cu povestea lui. */
export function faptelePotrivite(fapte: Fapt[]): Fapt[] {
  return fapte.filter((f) => TIPURI_RELEVANTE.has(f.tip));
}

const PROMPT_SISTEM = `Primești enunțul unui exercițiu de programare și câteva fapte despre cine îl
rezolvă. Rescrii enunțul înlocuind DOAR povestea din jur — numele obiectelor,
domeniul — cu ceva din contextul persoanei. NU schimba ce trebuie calculat,
ce parametri primește funcția sau ce tip de rezultat se cere: dacă enunțul
original cere o sumă, enunțul nou tot despre o sumă trebuie să vorbească, cu
alte obiecte. Scurt, 1-2 propoziții, în română. Răspunde numai cu enunțul
rescris, fără introduceri.`;

export async function personalizeazaEnuntul(
  motor: MLCEngineInterface,
  enuntOriginal: string,
  fapte: Fapt[],
): Promise<string | null> {
  const potrivite = faptelePotrivite(fapte);
  if (potrivite.length === 0) return null;

  const context = potrivite.map((f) => `- ${f.continut}`).join("\n");
  const raspuns = await ruleazaPeModel(() =>
    motor.chat.completions.create({
      messages: [
        { role: "system", content: PROMPT_SISTEM },
        {
          role: "user",
          content: `Enunț original:\n${enuntOriginal}\n\nDespre cine îl rezolvă:\n${context}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.4,
    }),
  );

  const rescris = raspuns.choices[0]?.message?.content?.trim();
  if (!rescris || rescris === enuntOriginal) return null;
  return rescris;
}
