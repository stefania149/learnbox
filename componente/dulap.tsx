import type { ReactNode } from "react";

/**
 * Dulapul din vestiar: piesele ecranului de profil.
 *
 * E un obiect desenat, ca și coperta, deci are paleta lui (`--tema-dulap-*`).
 * Ca peste tot, nicio culoare nu e scrisă aici — doar tokenuri (principiul 9).
 *
 * Tot ce e mobilă — becul, raftul, cărțile, ușa — e decor și e ascuns de
 * cititoarele de ecran. Conținutul citit cu voce tare e doar textul.
 */

export function Vestiar({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-dulap-camera px-4 py-8 font-mono text-dulap-text sm:px-6">
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </div>
  );
}

/** Corpul dulapului: interiorul, și ușa deschisă în dreapta. */
export function Dulap({
  usa,
  children,
}: {
  usa: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid overflow-hidden rounded-tema border-4 border-dulap-metal sm:grid-cols-[minmax(0,1fr)_10rem]">
      <div className="relative flex flex-col gap-6 bg-dulap-interior px-5 pb-5 pt-10 sm:px-8 sm:pb-8">
        <Bec />
        {children}
      </div>
      <div className="flex flex-col gap-4 border-t-4 border-dulap-metal bg-dulap-metal p-3 sm:border-l-4 sm:border-t-0">
        {usa}
      </div>
    </div>
  );
}

/** Tubul de neon de sub tavanul dulapului. */
function Bec() {
  return (
    <span
      aria-hidden
      className="absolute left-1/2 top-2 h-1.5 w-2/3 -translate-x-1/2 rounded-full bg-dulap-lampa shadow-[0_10px_60px_8px_var(--tema-dulap-lampa)]"
    />
  );
}

/** Afișul lipit cu bandă adezivă pe peretele din fund. */
export function Afis({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-fit rotate-[-1deg] p-2">
      <div className="rounded-[2px] bg-dulap-afis p-4 shadow-[0_18px_40px_-20px_var(--tema-dulap-camera)]">
        {children}
      </div>
      <Banda className="left-0 top-0 -rotate-12" />
      <Banda className="right-0 top-0 rotate-12" />
      <Banda className="bottom-0 left-0 rotate-12" />
      <Banda className="bottom-0 right-0 -rotate-12" />
    </div>
  );
}

function Banda({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute h-4 w-9 rounded-[2px] bg-dulap-text-slab opacity-40 ${className}`}
    />
  );
}

/**
 * Eticheta galbenă, scrisă de mână și subliniată de două ori. N-avem un font
 * de scris de mână (ar veni de pe alt server, iar aplicația trebuie să meargă
 * și fără rețea), deci scrisul e cursiv din fontul care există.
 */
export function ScrisDeMana({
  children,
  marime = "mic",
}: {
  children: ReactNode;
  marime?: "mic" | "mare";
}) {
  return (
    <span className="flex w-fit flex-col">
      <span
        className={
          marime === "mare"
            ? "text-2xl italic text-dulap-scris sm:text-3xl"
            : "text-sm italic text-dulap-scris"
        }
      >
        {children}
      </span>
      <span aria-hidden className="mt-1 flex flex-col gap-0.5">
        <span className="h-px w-16 -rotate-1 bg-dulap-scris" />
        <span className="h-px w-10 rotate-1 bg-dulap-scris" />
      </span>
    </span>
  );
}

/** Săgeata trasă de mână, de la o etichetă spre textul de sub ea. */
export function Sageata({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 32 24"
      className={`h-6 w-8 text-dulap-scris ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M2 22C4 10 12 3 28 4" />
      <path d="M28 4l-6 1M28 4l-2 5.5" />
    </svg>
  );
}

/** Aura de stele de deasupra portretului. */
export function Stele() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 26"
      className="mx-auto h-6 w-32 text-dulap-scris"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <ellipse cx="60" cy="14" rx="46" ry="9" />
      <path d="M22 8l1.5 3.5L27 13l-3.5 1.5L22 18l-1.5-3.5L17 13l3.5-1.5z" />
      <path d="M60 2l1.2 2.8L64 6l-2.8 1.2L60 10l-1.2-2.8L56 6l2.8-1.2z" />
      <path d="M98 7l1.5 3.5L103 12l-3.5 1.5L98 17l-1.5-3.5L93 12l3.5-1.5z" />
    </svg>
  );
}

/** Raftul de jos, cu ce stă pe el. Pur decor. */
export function Raft() {
  return (
    <div aria-hidden className="mt-2 flex flex-col">
      <div className="flex items-end justify-center gap-4 px-4">
        <Carti />
        <Laptop />
        <Pixuri />
      </div>
      <span className="h-2 w-full rounded-t-[2px] bg-dulap-raft" />
      <span className="h-3 w-full bg-dulap-metal-slab" />
    </div>
  );
}

function Carti() {
  return (
    <span className="flex w-16 flex-col gap-0.5">
      <span className="h-2.5 w-14 rounded-[1px] bg-dulap-metal" />
      <span className="h-2 w-16 rounded-[1px] bg-dulap-scris opacity-80" />
      <span className="h-3 w-15 rounded-[1px] bg-dulap-afis" />
    </span>
  );
}

function Laptop() {
  return (
    <span className="flex w-24 flex-col items-center">
      <span className="h-8 w-20 rounded-t-[2px] border border-dulap-margine bg-dulap-camera" />
      <span className="h-1.5 w-24 rounded-b-[2px] bg-dulap-metal" />
    </span>
  );
}

function Pixuri() {
  return (
    <span className="relative flex h-6 w-16 items-end">
      <span className="absolute bottom-0 left-0 h-1 w-14 -rotate-6 rounded-full bg-dulap-margine" />
      <span className="absolute bottom-1.5 left-1 h-1 w-12 rotate-3 rounded-full bg-dulap-scris" />
    </span>
  );
}

/** Autocolant lipit pe ușă. */
export function Autocolant({ children }: { children: ReactNode }) {
  return (
    <span className="flex min-h-11 items-center justify-center rounded-tema border border-dulap-margine bg-dulap-camera px-3 text-xs uppercase tracking-[0.15em] text-dulap-text">
      {children}
    </span>
  );
}

/** Fantele de aerisire și mânerul: partea de jos a ușii. */
export function FanteUsa() {
  return (
    <div aria-hidden className="flex flex-col gap-3 pt-2">
      <span className="ml-auto h-8 w-2 rounded-full bg-dulap-metal-slab" />
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="h-3 w-full rounded-full bg-dulap-metal-slab shadow-[inset_0_2px_0_var(--tema-dulap-margine)]"
        />
      ))}
    </div>
  );
}

/*
 * Portretul, un caracter pe pixel:
 *   p — păr, f — față, o — ochi, u — umeri, „.” — gol.
 * E un desen, nu o poză, și nu seamănă cu nimeni anume.
 */
const PORTRET = [
  "....pppppp....",
  "..pppppppppp..",
  ".pppppppppppp.",
  ".pppppppppppp.",
  ".ppffffffffpp.",
  ".pffffffffffp.",
  "..pfoffffofp..",
  "..pffffffffp..",
  "...ffffffff...",
  "....ffffff....",
  ".....ffff.....",
  "...uuuuuuuu...",
  "..uuuuuuuuuu..",
  ".uuuuuuuuuuuu.",
];

const CULORI: Record<string, string> = {
  p: "var(--tema-dulap-camera)",
  f: "var(--tema-dulap-text)",
  o: "var(--tema-dulap-camera)",
  u: "var(--tema-dulap-camera)",
};

export function PortretPixeli() {
  return (
    <svg
      role="img"
      aria-label="Portret desenat în pixeli"
      viewBox="0 0 14 14"
      className="h-40 w-40 sm:h-52 sm:w-52"
      shapeRendering="crispEdges"
    >
      {PORTRET.flatMap((rand, y) =>
        [...rand].map((semn, x) =>
          semn === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={CULORI[semn]}
            />
          ),
        ),
      )}
    </svg>
  );
}
