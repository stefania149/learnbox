import type { ReactNode } from "react";

/**
 * Structura unui ecran, definită o dată și refolosită: antet, conținut, bară de
 * acțiuni. Ecranele nu redesenează această structură și nu scriu culori — doar
 * tokenuri de temă.
 */
export function Ecran({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-fundal text-text">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:py-16">
        {children}
      </div>
    </div>
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
    <header className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {titlu}
      </h1>
      {subtitlu ? (
        <p className="text-base text-text-slab sm:text-lg">{subtitlu}</p>
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
    <section className="flex flex-col gap-4 rounded-tema border border-contur bg-suprafata p-6">
      {titlu ? (
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-slab">
          {titlu}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
