"use client";

import type { LinieIesire } from "@/lib/python/client";

/**
 * Consola de rezultat: ce a tipărit codul, ce a spus Python când s-a oprit, și
 * mesajul de cronometru. Scrise o singură dată, ca ecranele să nu le rescrie
 * fiecare în felul lui.
 */
export function Consola({
  iesire,
  gol,
}: {
  iesire: LinieIesire[];
  /** Ce scrie când n-a tipărit nimic. Lipsește — nu se arată nimic. */
  gol?: string;
}) {
  if (iesire.length === 0) {
    return gol ? <p className="text-sm text-text-slab">{gol}</p> : null;
  }

  return (
    <pre className="overflow-x-auto whitespace-pre-wrap rounded-tema bg-fundal p-4 font-mono text-sm">
      {iesire.map((linie, i) => (
        <span
          key={i}
          className={`block ${linie.flux === "stderr" ? "italic text-text-slab" : ""}`}
        >
          {linie.text}
        </span>
      ))}
    </pre>
  );
}

/** Traceback-ul real al Python-ului, niciodată rezumat de noi. */
export function Traceback({
  text,
  titlu = "Python s-a oprit și a explicat de ce:",
}: {
  text: string;
  titlu?: string;
}) {
  return (
    <>
      <p className="text-sm text-text-slab">{titlu}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-tema border border-contur p-4 font-mono text-sm">
        {text}
      </pre>
      {/* Cerut anume, în engleză: singura bucată de interfață care nu e în
          română. Stă sub traceback, unde codul tocmai a crăpat. */}
      <p className="text-sm italic text-text-slab">its not right but keep going</p>
    </>
  );
}

/**
 * Mesajul de la depășirea cronometrului, cuvânt cu cuvânt din `PLAN.md` §7.
 * E o lecție, nu o eroare — de-asta stă într-un singur loc.
 */
export function MesajCronometru({ secunde }: { secunde: number }) {
  return (
    <p className="text-text-slab">
      Codul tău a rulat {secunde} secunde și nu s-a oprit. Probabil ai o buclă
      care nu se termină — verifică dacă ceva chiar schimbă condiția.
    </p>
  );
}
