/**
 * Chatul cu asistentul — pasul 21 (`PLAN.md` §9).
 *
 * O unealtă, nu un personaj: răspunde la întrebări despre materie, explică o
 * greșeală, și atât. Nu laudă, nu consolează, nu inițiază — regulile astea
 * stau în promptul de sistem, fiindcă un model de 1B nu le respectă din
 * instinct (`CLAUDE.md` regula 3).
 */
import type { MLCEngineInterface } from "@mlc-ai/web-llm";
import type { Fapt, Mesaj } from "@/lib/date/asistent";
import { ruleazaPeModel } from "@/lib/rutare-model";

const PROMPT_SISTEM = `Ești asistentul din aplicația Tutore. Răspunzi scurt, în română, la
întrebări despre materia pe care o studiază utilizatorul — de ce dă o eroare,
ce înseamnă un termen, un exemplu în plus.

Reguli stricte:
- Nu lauda niciodată („Bravo", „Excelent", „Felicitări").
- Nu consola niciodată („Nu-i nimic", „O să reușești").
- Nu întreba cum se simte utilizatorul.
- Nu iniția conversația și nu propune subiecte noi de la tine — răspunzi doar la ce a fost întrebat.
- Fii concis: câteva propoziții, nu un eseu.`;

/** Ultimele mesaje trimise modelului ca istoric — destul cât să țină firul, nu tot. */
const FEREASTRA_ISTORIC = 12;

function contextulFaptelor(fapte: Fapt[]): string {
  if (fapte.length === 0) return "";
  const linii = fapte.map((f) => `- ${f.continut}`).join("\n");
  return `\n\nCe știi deja despre utilizator (nu întreba din nou):\n${linii}`;
}

export async function raspundeAsistentul(
  motor: MLCEngineInterface,
  istoric: Mesaj[],
  fapte: Fapt[],
): Promise<string> {
  const recente = istoric.slice(-FEREASTRA_ISTORIC);
  const raspuns = await ruleazaPeModel(() =>
    motor.chat.completions.create({
      messages: [
        { role: "system", content: PROMPT_SISTEM + contextulFaptelor(fapte) },
        ...recente.map((m) => ({
          role: m.rol === "utilizator" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        })),
      ],
      max_tokens: 400,
      temperature: 0.4,
    }),
  );
  return raspuns.choices[0]?.message?.content?.trim() || "N-am putut răspunde.";
}
