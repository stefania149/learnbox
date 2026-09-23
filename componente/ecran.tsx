import type { ReactNode } from "react";

/**
 * Structura unui ecran, definită o dată și refolosită: antet, conținut, bară de
 * acțiuni. Ecranele nu redesenează această structură și nu scriu culori — doar
 * tokenuri de temă.
 *
 * Tema e „terminal", aceeași ca pe copertă: biroul în spate, carcasa
 * monitorului în jur, sticla verde înăuntru. Coperta își desenează piesele ei
 * (`terminal.tsx`) fiindcă e un birou întreg, cu bare laterale; aici e doar
 * monitorul, fiindcă ecranele de lucru au nevoie de lățime, nu de decor.
 */
export function Ecran({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-fundal px-4 py-6 font-mono text-text sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl rounded-tema border border-rama-contur bg-rama p-3 sm:p-5">
        <div className="mb-2 flex items-center justify-between px-1 text-[0.65rem] uppercase tracking-[0.2em] text-rama-text">
          <span>Tutore-1</span>
          <span aria-hidden>▪ ▪ ▪</span>
        </div>
        <div className="relative overflow-hidden rounded-tema bg-sticla px-5 py-7 sm:px-8 sm:py-10">
          {/* Liniile de scanare sunt decor și nu se mișcă: un ecran care
              pâlpâie e un ecran pe care nu poți citi. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-10 [background-image:repeating-linear-gradient(to_bottom,var(--tema-accent)_0_1px,transparent_1px_4px)]"
          />
          <div className="relative flex flex-col gap-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Cele cinci benzi de sub titlu, ca pe carcasele din anii '80. Decor. */
function Dunga() {
  return (
    <span
      aria-hidden
      className="flex h-2 w-full max-w-sm overflow-hidden rounded-full"
    >
      <span className="flex-1 bg-dunga-1" />
      <span className="flex-1 bg-dunga-2" />
      <span className="flex-1 bg-dunga-3" />
      <span className="flex-1 bg-dunga-4" />
      <span className="flex-1 bg-dunga-5" />
    </span>
  );
}

export function AntetEcran({
  titlu,
  subtitlu,
}: {
  titlu: string;
  subtitlu?: string;
}) {
  return (
    <header className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold uppercase leading-tight tracking-[0.08em] text-accent [text-shadow:0_0_20px_color-mix(in_oklch,var(--tema-accent)_40%,transparent)] sm:text-4xl">
        {titlu}
      </h1>
      <Dunga />
      {subtitlu ? (
        <p className="max-w-prose text-sm text-text-slab sm:text-base">
          {subtitlu}
        </p>
      ) : null}
    </header>
  );
}

export function ContinutEcran({ children }: { children: ReactNode }) {
  return <main className="flex flex-col gap-6">{children}</main>;
}

export function BaraActiuni({ children }: { children: ReactNode }) {
  return (
    <footer className="flex flex-wrap items-center gap-3 border-t border-contur pt-6">
      {children}
    </footer>
  );
}

export function Panou({
  titlu,
  children,
}: {
  titlu?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-tema border border-contur bg-suprafata p-5">
      {titlu ? (
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {titlu}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
