"use client";

/*
 * Partea de PWA care trăiește în pagină: înregistrarea service worker-ului și
 * ce știe ecranul „Aplicația" despre el.
 *
 * Se înregistrează numai în build-ul de producție. În dezvoltare, un depozit
 * de bucăți de cod ar lupta cu Fast Refresh și ai depana o versiune care nu
 * mai există.
 */

import { useCallback, useEffect, useState } from "react";

const baza = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const pornit = process.env.NODE_ENV === "production";

/** Evenimentul Chrome de instalare; nu e în lib.dom. */
type EvenimentInstalare = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let cerereaDeInstalare: EvenimentInstalare | null = null;
const ascultatori = new Set<() => void>();

function anunta() {
  for (const a of ascultatori) a();
}

if (typeof window !== "undefined") {
  // Prins cât mai devreme: Chrome îl trimite o singură dată, adesea înainte ca
  // ecranul „Aplicația" să fie deschis.
  window.addEventListener("beforeinstallprompt", (ev) => {
    ev.preventDefault();
    cerereaDeInstalare = ev as EvenimentInstalare;
    anunta();
  });
  window.addEventListener("appinstalled", () => {
    cerereaDeInstalare = null;
    anunta();
  });
}

/** Se pune o dată, în layout. Nu desenează nimic. */
export function InregistrareServiceWorker() {
  useEffect(() => {
    if (!pornit || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker
      .register(`${baza}/sw.js`, { scope: `${baza}/` })
      .catch(() => {
        // Fără service worker aplicația merge întreagă, doar că are nevoie de
        // rețea. Nu e o eroare de arătat utilizatorului.
      });
  }, []);
  return null;
}

export type StareAplicatie = {
  /** Browserul poate instala, și n-a instalat încă. */
  sePoateInstala: boolean;
  /** Rulează în fereastră proprie, fără bară de browser. */
  instalata: boolean;
  /** Service worker-ul e înregistrat și conduce pagina. */
  pregatitOffline: boolean;
  /** O versiune nouă e descărcată și așteaptă. */
  actualizareGata: boolean;
  /** Cât ocupă tot ce ține browserul pentru acest site, în octeți. */
  ocupat: number | null;
  /** Motoarele Python și baza de date sunt în depozit. */
  motoareRetinute: boolean;
};

const GOL: StareAplicatie = {
  sePoateInstala: false,
  instalata: false,
  pregatitOffline: false,
  actualizareGata: false,
  ocupat: null,
  motoareRetinute: false,
};

async function citesteStarea(): Promise<StareAplicatie> {
  const instalata =
    typeof window !== "undefined" &&
    window.matchMedia("(display-mode: standalone)").matches;

  let pregatitOffline = false;
  let actualizareGata = false;
  if ("serviceWorker" in navigator) {
    const inreg = await navigator.serviceWorker.getRegistration(`${baza}/`);
    pregatitOffline = Boolean(inreg?.active);
    actualizareGata = Boolean(inreg?.waiting);
  }

  let ocupat: number | null = null;
  if (navigator.storage?.estimate) {
    ocupat = (await navigator.storage.estimate()).usage ?? null;
  }

  let motoareRetinute = false;
  if ("caches" in window) {
    const nume = await caches.keys();
    const alMotoarelor = nume.find((n) => n.startsWith("tutore-motoare-"));
    if (alMotoarelor) {
      const cache = await caches.open(alMotoarelor);
      motoareRetinute = (await cache.keys()).length > 0;
    }
  }

  return {
    sePoateInstala: cerereaDeInstalare !== null,
    instalata,
    pregatitOffline,
    actualizareGata,
    ocupat,
    motoareRetinute,
  };
}

export function useStareAplicatie() {
  const [stare, setStare] = useState<StareAplicatie>(GOL);

  const reciteste = useCallback(() => {
    void citesteStarea().then(setStare);
  }, []);

  useEffect(() => {
    reciteste();
    ascultatori.add(reciteste);
    return () => {
      ascultatori.delete(reciteste);
    };
  }, [reciteste]);

  return { stare, reciteste };
}

/** Deschide dialogul browserului. Întoarce `true` dacă utilizatorul a acceptat. */
export async function ceriInstalarea(): Promise<boolean> {
  const cerere = cerereaDeInstalare;
  if (!cerere) return false;
  await cerere.prompt();
  const { outcome } = await cerere.userChoice;
  // Evenimentul se consumă: a doua oară trebuie așteptat unul nou.
  cerereaDeInstalare = null;
  anunta();
  return outcome === "accepted";
}

/** Spune versiunii care așteaptă să preia, apoi reîncarcă pagina. */
export async function aplicaActualizarea(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const inreg = await navigator.serviceWorker.getRegistration(`${baza}/`);
  if (!inreg?.waiting) return;
  await new Promise<void>((rezolva) => {
    navigator.serviceWorker.addEventListener("controllerchange", () => rezolva(), {
      once: true,
    });
    inreg.waiting?.postMessage("preia-acum");
  });
  window.location.reload();
}
