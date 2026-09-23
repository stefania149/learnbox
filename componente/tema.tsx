"use client";

/**
 * Pune atributul `data-tema` pe `<html>`, citit din `setari.tema_activa` —
 * pasul 24. Când valoarea e „auto" (pasul 25), urmează tema implicită a
 * cursului curent (`setari.materie_activa`, scrisă din `lib/date/seminte.ts`
 * la fiecare așezare) — fiecare materie primește tema ei, până alegi tu una
 * fixă din `/setari/`.
 *
 * Până răspunde baza de date, `:root` fără atribut rămâne „terminal"
 * (`app/globals.css`), ca să nu sară vizual ecranul la fiecare încărcare.
 */
import { useEffect } from "react";
import { citesteSetari } from "@/lib/date/setari";
import { temaCurenta } from "@/lib/teme/rezolva";

export function AplicaTema() {
  useEffect(() => {
    let anulat = false;
    (async () => {
      const setari = await citesteSetari();
      const tema = await temaCurenta(setari.temaActiva, setari.materieActiva);
      if (!anulat) document.documentElement.dataset.tema = tema;
    })().catch(() => {
      // Fără bază, rămâne fallback-ul din CSS — un ecran nefolosibil nu
      // merită și o temă greșită.
    });
    return () => {
      anulat = true;
    };
  }, []);

  return null;
}
