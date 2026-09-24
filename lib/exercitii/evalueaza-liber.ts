/**
 * Evaluarea unui răspuns liber, cu rubrică — pasul 27 (`PLAN.md` §7, §12).
 *
 * Singurul loc din aplicație unde verdictul trece prin model. Regula 1
 * (`CLAUDE.md`) vorbește despre exerciții CU execuție; cele fără execuție n-au
 * altă cale — `PLAN.md` §12 o numește pe față „punctul slab". Promptul e
 * izolat: vede doar rubrica și răspunsul, niciodată conversația sau alt
 * context — altfel modelul dă dreptate cuiva convingător, nu cuiva corect
 * (`PLAN.md` §12).
 *
 * Fără model (regula 5), un răspuns tot se salvează — vezi `raportNeevaluat`
 * — cu XP-ul garantat al unei încercări, dar fără verdict pe puncte.
 */
import type { MLCEngineInterface } from "@mlc-ai/web-llm";
import { ruleazaPeModel } from "@/lib/rutare-model";

export type ItemRubrica = { criteriu: string; indeplinit: boolean };
export type VerdictLiber = "corect" | "partial" | "niciunul" | "neevaluat";

export type RaportLiber = {
  verdict: VerdictLiber;
  itemi: ItemRubrica[];
  trecute: number;
  total: number;
};

const PROMPT_SISTEM = `Evaluezi un răspuns față de o rubrică, punct cu punct. Nu vezi nimic altceva
— nu conversația, nu ce s-a mai discutat. Pentru fiecare punct din rubrică,
decizi dacă răspunsul îl îndeplinește, cât de cât și cu alte cuvinte, sau dacă
lipsește cu totul. Fii îngăduitor cu formularea, exigent cu conținutul.
Răspunde numai cu JSON conform schemei, cu exact atâtea valori în
"indeplinite" câte puncte are rubrica, în aceeași ordine.`;

const SCHEMA_EVALUARE = {
  type: "object",
  properties: {
    indeplinite: { type: "array", items: { type: "boolean" } },
  },
  required: ["indeplinite"],
};

function verdictul(trecute: number, total: number): VerdictLiber {
  if (total > 0 && trecute === total) return "corect";
  return trecute > 0 ? "partial" : "niciunul";
}

export async function evalueazaLiber(
  motor: MLCEngineInterface,
  rubrica: string[],
  raspuns: string,
): Promise<RaportLiber> {
  const raspunsModel = await ruleazaPeModel(() =>
    motor.chat.completions.create({
      messages: [
        { role: "system", content: PROMPT_SISTEM },
        {
          role: "user",
          content: `Rubrica:\n${rubrica.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nRăspunsul de evaluat:\n${raspuns}`,
        },
      ],
      response_format: { type: "json_object", schema: JSON.stringify(SCHEMA_EVALUARE) },
      max_tokens: 300,
      temperature: 0,
    }),
  );

  let indeplinite: unknown[] = [];
  try {
    const o = JSON.parse(raspunsModel.choices[0]?.message?.content ?? "{}") as Record<
      string,
      unknown
    >;
    if (Array.isArray(o.indeplinite)) indeplinite = o.indeplinite;
  } catch {
    indeplinite = [];
  }

  // Modelul poate răspunde cu mai puține sau mai multe valori decât puncte —
  // ce lipsește se ia drept neîndeplinit, nu se aruncă evaluarea întreagă.
  const itemi: ItemRubrica[] = rubrica.map((criteriu, i) => ({
    criteriu,
    indeplinit: indeplinite[i] === true,
  }));
  const trecute = itemi.filter((it) => it.indeplinit).length;

  return { verdict: verdictul(trecute, rubrica.length), itemi, trecute, total: rubrica.length };
}

/** Fără model (regula 5): răspunsul se păstrează, dar nu s-a putut citi. */
export function raportNeevaluat(rubrica: string[]): RaportLiber {
  return {
    verdict: "neevaluat",
    itemi: rubrica.map((criteriu) => ({ criteriu, indeplinit: false })),
    trecute: 0,
    total: rubrica.length,
  };
}
