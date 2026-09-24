"use client";

import { useState } from "react";
import { Buton } from "./buton";
import type { RegistruTon } from "@/lib/date/setari";
import { REPLICA_ZERO_NEUTRU, replicaZeroAleatoare } from "@/lib/mascota/replici";

/**
 * Reacția la zero XP (pasul 26, `PLAN.md` §8) — mereu oferă un exercițiu ușor,
 * dar cum se arată depinde de registrul de ton (`lib/date/setari.ts`):
 * jucăuș = mascotă animată + replică + confetti, neutru = o linie fără
 * personaj, sec = cifra și atât. Formă originală (o formă abstractă simplă,
 * animabilă din CSS, `PLAN.md` Î-3) — nu un personaj din altă parte.
 */
export function ReactieZero({
  ton,
  onIncearca,
  onIesi,
}: {
  ton: RegistruTon;
  onIncearca: () => void;
  onIesi: () => void;
}) {
  const [replica] = useState(replicaZeroAleatoare);

  if (ton === "sec") {
    return (
      <section className="flex flex-col gap-4 rounded-tema border border-contur bg-suprafata p-5">
        <p className="text-text">0 XP.</p>
        <div className="flex flex-wrap gap-3">
          <Buton onClick={onIncearca}>Un exercițiu ușor</Buton>
          <Buton fel="secundar" onClick={onIesi}>
            Ies
          </Buton>
        </div>
      </section>
    );
  }

  if (ton === "neutru") {
    return (
      <section className="flex flex-col gap-4 rounded-tema border border-contur bg-suprafata p-5">
        <p className="text-text-slab">{REPLICA_ZERO_NEUTRU}</p>
        <div className="flex flex-wrap gap-3">
          <Buton onClick={onIncearca}>Încearcă un exercițiu ușor</Buton>
          <Buton fel="secundar" onClick={onIesi}>
            Ies din lecție
          </Buton>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center gap-4 rounded-tema border border-contur bg-suprafata p-6 text-center">
      <Confetti />
      <Mascota />
      <p className="text-text">{replica}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Buton onClick={onIncearca}>Încearcă un exercițiu ușor</Buton>
        <Buton fel="secundar" onClick={onIesi}>
          Ies din lecție
        </Buton>
      </div>
    </section>
  );
}

/** Formă proprie, nu un personaj din altă parte — ascunsă în tema minimalistă (`app/globals.css`). */
function Mascota() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      width="72"
      height="72"
      className="mascota-figura"
    >
      <path d="M18 58 Q50 8 82 58 Z" fill="var(--tema-accent)" />
      <ellipse cx="50" cy="62" rx="32" ry="26" fill="var(--tema-accent)" />
      <circle cx="37" cy="58" r="7" fill="var(--tema-sticla)" />
      <circle cx="63" cy="58" r="7" fill="var(--tema-sticla)" />
      <circle cx="38" cy="59" r="3" fill="var(--tema-accent-text)" />
      <circle cx="64" cy="59" r="3" fill="var(--tema-accent-text)" />
    </svg>
  );
}

function Confetti() {
  return (
    <span aria-hidden className="mascota-confetti flex gap-1.5">
      <span className="h-2 w-2 rounded-full bg-dunga-1" />
      <span className="h-2 w-2 rounded-full bg-dunga-2" />
      <span className="h-2 w-2 rounded-full bg-dunga-3" />
      <span className="h-2 w-2 rounded-full bg-dunga-4" />
      <span className="h-2 w-2 rounded-full bg-dunga-5" />
    </span>
  );
}
