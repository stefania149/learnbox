/**
 * Extragerea faptelor din conversație, în fundal — pasul 21 (`PLAN.md` §9,
 * §12; `CLAUDE.md` regula 10).
 *
 * Doar ce schimbă conținutul: facultate, examen, materii făcute, lungimea
 * sesiunilor, ce exemple sunt clare. Niciodată stări emoționale — modelul nu
 * e lăsat să aleagă categoria liber, ci alege dintr-o listă fixă (`enum` în
 * schemă), ca să nu strecoare „utilizatorul pare frustrat" pe sub o categorie
 * apropiată.
 */
import type { MLCEngineInterface } from "@mlc-ai/web-llm";
import type { Fapt } from "@/lib/date/asistent";
import { ruleazaPeModel } from "@/lib/rutare-model";

export const TIPURI_FAPT = [
  "facultate",
  "examen",
  "materie_facuta",
  "lungime_sesiune",
  "exemplu_clar",
] as const;
export type TipFapt = (typeof TIPURI_FAPT)[number];

/** Eticheta de pe ecran pentru fiecare categorie — pasul 22. */
export const ETICHETA_TIP: Record<TipFapt, string> = {
  facultate: "Facultate",
  examen: "Examen",
  materie_facuta: "Materie făcută",
  lungime_sesiune: "Lungimea sesiunii",
  exemplu_clar: "Exemplu clar",
};

const SCHEMA_FAPTE = {
  type: "object",
  properties: {
    fapte: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tip: { type: "string", enum: [...TIPURI_FAPT] },
          continut: { type: "string" },
        },
        required: ["tip", "continut"],
      },
    },
  },
  required: ["fapte"],
};

const PROMPT_SISTEM = `Citești un schimb de replici dintr-un chat de studiu și scoți doar faptele noi
despre utilizator care se încadrează în categoriile:
- facultate: la ce facultate sau domeniu studiază
- examen: ce examen are și când
- materie_facuta: ce materii a mai făcut deja
- lungime_sesiune: cât de lungi îi plac sesiunile de studiu
- exemplu_clar: ce fel de exemple i-au fost clare

NU scoate stări emoționale, motivație, frustrare sau orice altceva. Dacă
schimbul ăsta nu conține niciun fapt din listă, sau faptul apare deja în „Ce
se știe deja", întoarce o listă goală. Răspunde numai cu JSON, în română,
conform schemei.`;

function normalizeaza(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Cuvinte românești atât de comune încât apar în aproape orice propoziție —
 * „este", „care", „sunt" ies din orice text de peste câteva rânduri. Fără
 * lista asta, verificarea de mai jos „găsește" ancoră peste tot și nu
 * respinge nimic (văzut la testare: un fapt inventat a trecut doar fiindcă
 * amândouă textele conțineau „este").
 */
const CUVINTE_COMUNE = new Set([
  "este", "sunt", "care", "unei", "unui", "fost", "doar", "deja", "pentru",
  "acest", "această", "aceasta", "acesta", "foarte", "poate", "dintr",
  "avea", "fără", "după", "când", "unde", "cum", "mult", "mai", "tot",
  "toate", "toți", "nici", "dacă", "atunci", "prin", "către", "spre",
  "între", "asupra", "despre", "lângă", "fiecare", "orice", "oricare",
  "altfel", "decât", "însă", "deci", "iar", "chiar", "poți", "vrei",
  "știu", "știi", "spun", "spui", "zice", "zici", "bine", "rău",
]);

/** Cuvintele de conținut dintr-un text — fără cele din lista de mai sus. */
function cuvintele(text: string): Set<string> {
  const toate = normalizeaza(text).match(/[a-zăâîșț0-9]{4,}/g) ?? [];
  return new Set(toate.filter((c) => !CUVINTE_COMUNE.has(c)));
}

/**
 * Modelul tinde să copieze descrierile categoriilor din prompt, sau să
 * inventeze cu totul, ca și cum ar fi fapte reale — văzut la testare de două
 * ori: o dată copiind categoriile din prompt, o dată completând un șablon cu
 * text de umplutură ("[numărul de anumători] anumători"). Un fapt care n-are
 * niciun cuvânt de conținut comun cu schimbul citit chiar n-a fost spus — se
 * aruncă, la fel ca la pasul 20.
 */
function ancoratInText(continut: string, sursa: Set<string>): boolean {
  const cuvinteleFaptului = cuvintele(continut);
  for (const c of cuvinteleFaptului) {
    if (sursa.has(c)) return true;
  }
  return false;
}

/** Rulează pe un schimb utilizator+asistent; nu se cheamă din firul principal al trimiterii. */
export async function extrageFaptele(
  motor: MLCEngineInterface,
  mesajUtilizator: string,
  mesajAsistent: string,
  existente: Fapt[],
): Promise<{ tip: TipFapt; continut: string }[]> {
  const cunoscute =
    existente.length > 0
      ? `Ce se știe deja:\n${existente.map((f) => `- ${f.continut}`).join("\n")}`
      : "Ce se știe deja: nimic încă.";

  const raspuns = await ruleazaPeModel(() =>
    motor.chat.completions.create({
      messages: [
        { role: "system", content: PROMPT_SISTEM },
        {
          role: "user",
          content: `${cunoscute}\n\nSchimbul de citit:\nUtilizator: ${mesajUtilizator}\nAsistent: ${mesajAsistent}`,
        },
      ],
      response_format: { type: "json_object", schema: JSON.stringify(SCHEMA_FAPTE) },
      max_tokens: 300,
      temperature: 0.1,
    }),
  );

  const continut = raspuns.choices[0]?.message?.content ?? "";
  let extrase: { tip: TipFapt; continut: string }[];
  try {
    const desfacut = JSON.parse(continut) as { fapte?: unknown };
    if (!Array.isArray(desfacut.fapte)) return [];
    extrase = desfacut.fapte.flatMap((f): { tip: TipFapt; continut: string }[] => {
      if (typeof f !== "object" || f === null) return [];
      const o = f as Record<string, unknown>;
      if (typeof o.tip !== "string" || typeof o.continut !== "string") return [];
      if (!(TIPURI_FAPT as readonly string[]).includes(o.tip)) return [];
      const c = o.continut.trim();
      if (!c) return [];
      return [{ tip: o.tip as TipFapt, continut: c }];
    });
  } catch {
    return [];
  }

  const dejaStiute = new Set(existente.map((f) => normalizeaza(f.continut)));
  const sursa = cuvintele(`${mesajUtilizator} ${mesajAsistent}`);
  return extrase.filter(
    (f) => !dejaStiute.has(normalizeaza(f.continut)) && ancoratInText(f.continut, sursa),
  );
}
