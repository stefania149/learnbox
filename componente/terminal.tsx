import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

/**
 * Piesele copertei retro: biroul, carcasa, ecranul cu fosfor, meniul lateral.
 *
 * Aceeași regulă ca la `ecran.tsx`: structura se definește o dată și se
 * refolosește, iar culorile vin numai din tokenuri (principiul 9). Coperta are
 * paleta ei (`--tema-retro-*`) fiindcă e un obiect desenat, nu un ecran de
 * lucru; la pasul 24 paleta aia devine tema „terminal".
 */

export function Birou({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-retro-lemn px-4 py-6 font-mono text-retro-eticheta sm:px-6 sm:py-10">
      {/* Pe telefon totul curge: sigla, ecranul, apoi meniul. Pe lat, ecranul
          trece la mijloc, iar barele laterale se așază în jurul lui. */}
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:auto-rows-min lg:grid-cols-[16rem_minmax(0,1fr)_14rem]">
        {children}
      </div>
    </div>
  );
}

/** Cutie pe carcasă: rama din jurul oricărui bloc care nu e ecranul. */
export function CutieRetro({
  titlu,
  children,
  className = "",
}: {
  titlu?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col gap-3 rounded-tema border border-retro-contur bg-retro-carcasa p-4 ${className}`}
    >
      {titlu ? (
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-retro-eticheta-slab">
          {titlu}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

/** Cele cinci benzi de sub titlu. Decor, deci ascunse de cititoarele de ecran. */
export function DungaRetro({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex h-2 w-full max-w-sm overflow-hidden rounded-full ${className}`}
    >
      <span className="flex-1 bg-retro-dunga-1" />
      <span className="flex-1 bg-retro-dunga-2" />
      <span className="flex-1 bg-retro-dunga-3" />
      <span className="flex-1 bg-retro-dunga-4" />
      <span className="flex-1 bg-retro-dunga-5" />
    </span>
  );
}

/**
 * Monitorul: carcasă groasă, sticlă verde, linii de scanare peste tot.
 * Liniile sunt pur decorative și nu se mișcă — un ecran care pâlpâie e un
 * ecran pe care nu poți citi.
 */
export function EcranCrt({
  eticheta,
  children,
}: {
  eticheta: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-tema border border-retro-contur bg-retro-carcasa p-3 sm:p-5">
      <div className="mb-2 flex items-center justify-between px-1 text-[0.65rem] uppercase tracking-[0.2em] text-retro-eticheta-slab">
        <span>{eticheta}</span>
        <span aria-hidden>▪ ▪ ▪</span>
      </div>
      <div className="relative overflow-hidden rounded-tema bg-retro-ecran px-5 py-7 text-retro-fosfor-slab sm:px-9 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10 [background-image:repeating-linear-gradient(to_bottom,var(--tema-retro-fosfor)_0_1px,transparent_1px_4px)]"
        />
        <div className="relative flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}

/** Titlul mare, cu aura de fosfor a unui tub catodic. */
export function TitluCrt({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-3xl font-bold uppercase leading-tight tracking-[0.08em] text-retro-fosfor [text-shadow:0_0_20px_color-mix(in_oklch,var(--tema-retro-fosfor)_40%,transparent)] sm:text-5xl">
      {children}
    </h1>
  );
}

/**
 * Un rând de informație desenat ca un câmp de formular. Formularul e doar
 * forma: nu se cere nimic de la utilizator, fiindcă n-are unde să se ducă ce
 * ar scrie — nu există cont și nu există server.
 */
export function CampCrt({
  eticheta,
  valoare,
  detaliu,
}: {
  eticheta: string;
  valoare: string;
  detaliu?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-tema border border-retro-ecran-slab bg-retro-ecran-slab px-4 py-3">
      <span aria-hidden className="text-retro-fosfor">
        ▸
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-retro-fosfor-slab">
          {eticheta}
        </span>
        <span className="break-words text-retro-fosfor">{valoare}</span>
        {detaliu ? (
          <span className="text-xs text-retro-fosfor-slab">{detaliu}</span>
        ) : null}
      </span>
    </div>
  );
}

const stilBaza =
  // min-h-11 = 44px, ca peste tot în aplicație: ținta minimă de atingere.
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-tema px-5 " +
  "text-sm font-bold uppercase tracking-[0.12em] transition-opacity " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-retro-fosfor";

const stiluri = {
  principal: "bg-retro-fosfor text-retro-ecran hover:opacity-90",
  secundar:
    "border border-retro-fosfor-slab text-retro-fosfor hover:border-retro-fosfor hover:bg-retro-ecran-slab",
} as const;

export function LegaturaCrt({
  fel = "principal",
  className = "",
  children,
  ...rest
}: ComponentProps<typeof Link> & {
  fel?: keyof typeof stiluri;
  children: ReactNode;
}) {
  return (
    <Link
      className={`${stilBaza} ${stiluri[fel]} ${className}`}
      prefetch={false}
      {...rest}
    >
      {children}
    </Link>
  );
}

const ICOANE = {
  monitor: (
    <>
      <rect x="1.5" y="2.5" width="13" height="9" rx="1" />
      <path d="M6 14h4M8 11.5V14" />
    </>
  ),
  harta: (
    <>
      <path d="M2 4.5h5M2 8h5M2 11.5h5" />
      <path d="M9.5 4.5h4.5M9.5 8h4.5M9.5 11.5h4.5" />
    </>
  ),
  cod: (
    <>
      <path d="M5.5 5 2.5 8l3 3" />
      <path d="M10.5 5l3 3-3 3" />
    </>
  ),
  unealta: (
    <>
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" />
    </>
  ),
  info: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7.5v4M8 5h.01" />
    </>
  ),
} as const;

function Icoana({ nume }: { nume: keyof typeof ICOANE }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="square"
    >
      {ICOANE[nume]}
    </svg>
  );
}

export type ElementMeniu = {
  href: string;
  eticheta: string;
  icoana: keyof typeof ICOANE;
  activ?: boolean;
};

export function MeniuRetro({ elemente }: { elemente: ElementMeniu[] }) {
  return (
    <nav aria-label="Secțiunile aplicației">
      <ul className="flex flex-col gap-1">
        {elemente.map((e) => (
          <li key={e.href}>
            <Link
              href={e.href}
              prefetch={false}
              aria-current={e.activ ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-tema px-3 text-sm uppercase tracking-[0.12em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retro-fosfor ${
                e.activ
                  ? "border border-retro-fosfor-slab bg-retro-carcasa-slab text-retro-fosfor"
                  : "text-retro-eticheta hover:bg-retro-carcasa-slab"
              }`}
            >
              <Icoana nume={e.icoana} />
              <span className="flex-1">{e.eticheta}</span>
              {e.activ ? <span aria-hidden>›</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Un rând de stare: nume în stânga, valoare în dreapta. */
export function RandStare({
  nume,
  valoare,
}: {
  nume: string;
  valoare: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs uppercase tracking-[0.12em]">
      <span className="text-retro-eticheta-slab">{nume}</span>
      <span className="text-retro-fosfor">{valoare}</span>
    </div>
  );
}

/** Promptul care clipește. Se oprește dacă sistemul cere mai puțină mișcare. */
export function Prompt({ text }: { text: string }) {
  return (
    <p className="rounded-tema bg-retro-ecran px-3 py-2 text-xs text-retro-fosfor">
      {text}{" "}
      <span aria-hidden className="animate-pulse motion-reduce:animate-none">
        ▌
      </span>
    </p>
  );
}
