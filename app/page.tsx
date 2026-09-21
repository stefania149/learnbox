import {
  Birou,
  CampCrt,
  CutieRetro,
  DungaRetro,
  EcranCrt,
  LegaturaCrt,
  MeniuRetro,
  Prompt,
  RandStare,
  TitluCrt,
  type ElementMeniu,
} from "@/componente/terminal";
import { CAPITOL, MATERIE } from "@/lib/continut/functii-si-bucle";

/**
 * Coperta: primul ecran, desenat ca un calculator de acum patruzeci de ani.
 *
 * Nu deschide baza de date și nu pornește Python. Tot ce scrie aici vine din
 * capitolul livrat, care e un fișier — ecranul apare instantaneu, iar cei
 * ~30 MB de WebAssembly se descarcă abia când intri în curs.
 */

const LECTII = CAPITOL.niveluri.length;
const EXERCITII = CAPITOL.niveluri.reduce((s, n) => s + n.exercitii.length, 0);

const MENIU: ElementMeniu[] = [
  { href: "/", eticheta: "Acasă", icoana: "monitor", activ: true },
  { href: "/curs/", eticheta: "Curs", icoana: "harta" },
  { href: "/progres/", eticheta: "Progres", icoana: "info" },
  { href: "/python/", eticheta: "Scrie cod", icoana: "cod" },
  { href: "/setari/", eticheta: "Setări", icoana: "unealta" },
  { href: "/stare/", eticheta: "Stare", icoana: "monitor" },
];

export default function Acasa() {
  return (
    <Birou>
      <CutieRetro className="order-1 lg:col-start-1 lg:row-start-1 lg:self-start">
        <p className="text-2xl font-bold uppercase tracking-[0.2em] text-retro-fosfor">
          Tutore
        </p>
        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-retro-eticheta-slab">
          Învață în browser
        </p>
        <DungaRetro />
      </CutieRetro>

      <CutieRetro className="order-3 lg:col-start-1 lg:row-start-2 lg:self-start">
        <MeniuRetro elemente={MENIU} />
      </CutieRetro>

      <CutieRetro
        titlu="Stare sistem"
        className="order-4 lg:col-start-1 lg:row-start-3 lg:self-start"
      >
        <RandStare nume="Server" valoare="niciunul" />
        <RandStare nume="Cont" valoare="niciunul" />
        <RandStare nume="Date" valoare="în browser" />
        <RandStare nume="Motor" valoare="Python" />
        <Prompt text="GATA." />
      </CutieRetro>

      <main className="order-2 min-w-0 lg:col-start-2 lg:row-span-3 lg:row-start-1">
        <EcranCrt eticheta="Tutore-1">
          <div className="flex flex-col gap-4">
            <TitluCrt>Bine ai venit</TitluCrt>
            <DungaRetro />
            <p className="max-w-prose">
              Un joc de învățat care rulează întreg aici, în fila asta. Citești
              un briefing, scrii cod, iar cazurile de test spun ce a ieșit.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <CampCrt eticheta="Curs" valoare={MATERIE} />
            <CampCrt
              eticheta="Capitolul 1"
              valoare={CAPITOL.nume}
              detaliu={`${LECTII} lecții · ${EXERCITII} exerciții · lecțiile se deschid pe rând`}
            />
            <CampCrt
              eticheta="Progresul tău"
              valoare="Rămâne pe calculatorul tău"
              detaliu="Nu pleacă nicăieri și nu se șterge singur."
            />
          </div>

          <div className="flex flex-col gap-4">
            <LegaturaCrt href="/curs/" className="w-full">
              Intră în curs <span aria-hidden>→</span>
            </LegaturaCrt>

            <div
              aria-hidden
              className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-retro-fosfor-slab"
            >
              <span className="h-px flex-1 bg-retro-fosfor-slab" />
              sau
              <span className="h-px flex-1 bg-retro-fosfor-slab" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <LegaturaCrt href="/progres/" fel="secundar">
                Progres
              </LegaturaCrt>
              <LegaturaCrt href="/python/" fel="secundar">
                Scrie cod
              </LegaturaCrt>
              <LegaturaCrt href="/setari/" fel="secundar">
                Setări
              </LegaturaCrt>
            </div>

            <p className="text-center text-xs text-retro-fosfor-slab">
              Fără cont și fără parolă. N-ar avea unde să se ducă: nu există
              server.
            </p>
          </div>
        </EcranCrt>
      </main>

      <aside className="order-5 flex flex-col gap-4 lg:col-start-3 lg:row-span-3 lg:row-start-1">
        <CutieRetro titlu="Cum merge">
          <ul className="flex flex-col gap-1 text-sm uppercase tracking-[0.12em] text-retro-fosfor-slab">
            <li>&gt; Citești</li>
            <li>&gt; Scrii</li>
            <li>&gt; Rulezi</li>
            <li>&gt; Vezi ce a ieșit</li>
          </ul>
        </CutieRetro>

        <p className="rotate-[-1.5deg] rounded-tema bg-retro-chihlimbar px-4 py-3 text-sm text-retro-lemn">
          Orice încercare adună XP. Nimic de aici nu scade vreodată.
        </p>

        <CutieRetro titlu="Totul local">
          <p className="text-sm text-retro-eticheta">
            Python rulează în browser, iar progresul stă într-o bază de date din
            browser. Nimic nu pleacă spre altcineva.
          </p>
        </CutieRetro>
      </aside>
    </Birou>
  );
}
