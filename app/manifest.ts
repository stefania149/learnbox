import type { MetadataRoute } from "next";

// Calea de bază nu se aplică singură înăuntrul manifestului: Next o pune în
// eticheta <link>, dar adresele dinăuntru le scriem noi.
const baza = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Singurele două culori scrise ca text în tot proiectul. Manifestul e citit de
// sistemul de operare înainte să existe CSS, deci nu poate primi tokenuri
// (principiul 9 vorbește despre ecrane). Valorile sunt `--tema-accent` și
// `--tema-fundal` din tema deschisă, convertite în hex.
const ACCENT = "#2f5bd0";
const FUNDAL = "#f7f7fa";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tutore",
    short_name: "Tutore",
    description:
      "Un joc de învățat Python, care rulează întreg în browser. Fără server, fără cont.",
    lang: "ro",
    dir: "ltr",
    start_url: `${baza}/`,
    scope: `${baza}/`,
    display: "standalone",
    orientation: "any",
    background_color: FUNDAL,
    theme_color: ACCENT,
    categories: ["education"],
    icons: [
      {
        src: `${baza}/iconite/iconita-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${baza}/iconite/iconita-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Android decupează iconița în forma lui; asta are marginea de
        // siguranță desenată înăuntru.
        src: `${baza}/iconite/iconita-masca-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Continuă cursul",
        url: `${baza}/curs/`,
      },
      {
        name: "Progres",
        url: `${baza}/progres/`,
      },
    ],
  };
}
