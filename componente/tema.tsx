"use client";

/**
 * Pune atributul `data-tema` pe `<html>`, citit din `setari.tema_activa` —
 * pasul 24. Până răspunde baza de date, `:root` fără atribut rămâne „terminal"
 * (`app/globals.css`), ca să nu sară vizual ecranul la fiecare încărcare.
 */
import { useEffect } from "react";
import { citesteSetari } from "@/lib/date/setari";
import { temaValida } from "@/lib/teme/teme";

export function AplicaTema() {
  useEffect(() => {
    let anulat = false;
    citesteSetari()
      .then((setari) => {
        if (!anulat) document.documentElement.dataset.tema = temaValida(setari.temaActiva);
      })
      .catch(() => {
        // Fără bază, rămâne fallback-ul din CSS — un ecran nefolosibil nu
        // merită și o temă greșită.
      });
    return () => {
      anulat = true;
    };
  }, []);

  return null;
}
