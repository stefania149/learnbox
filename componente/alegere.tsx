import type { ReactNode } from "react";

/**
 * Un grup de opțiuni exclusive. Radio native — comută din tastatură cu
 * săgețile și se citesc corect de cititoarele de ecran. Eticheta e
 * permanentă, nu placeholder.
 */
export function GrupAlegere({
  legenda,
  ajutor,
  children,
}: {
  legenda: string;
  ajutor?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-semibold uppercase tracking-wide text-text-slab">
        {legenda}
      </legend>
      {ajutor ? <p className="text-sm text-text-slab">{ajutor}</p> : null}
      <div className="flex flex-col gap-2">{children}</div>
    </fieldset>
  );
}

export function Alegere({
  nume,
  valoare,
  titlu,
  explicatie,
  aleasa,
  dezactivata,
  onAlege,
}: {
  nume: string;
  valoare: string;
  titlu: string;
  explicatie: string;
  aleasa: boolean;
  dezactivata?: boolean;
  onAlege: (valoare: string) => void;
}) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-tema border p-4 transition-colors ${
        aleasa ? "border-accent" : "border-contur hover:border-text-slab"
      } ${dezactivata ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        type="radio"
        name={nume}
        value={valoare}
        checked={aleasa}
        disabled={dezactivata}
        onChange={() => onAlege(valoare)}
        className="mt-1 size-4 accent-accent"
      />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{titlu}</span>
        <span className="text-sm text-text-slab">{explicatie}</span>
      </span>
    </label>
  );
}
