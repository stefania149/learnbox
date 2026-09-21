import type { NextConfig } from "next";

// GitHub Pages servește un site de proiect sub /<nume-repo>/. Calea vine din
// mediu, ca workflow-ul s-o poată seta iar dezvoltarea locală să ruleze la „/".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Export static: fără server, fără rute API, fără Server Actions (principiul 6).
  output: "export",
  basePath,
  // Fără optimizare de imagini — aceea ar cere un server la rulare.
  images: { unoptimized: true },
  // Rădăcina proiectului, ca să nu urce căutarea până în directorul personal.
  turbopack: { root: import.meta.dirname },
  // Pagini ca /stare/index.html, ca să meargă direct pe GitHub Pages.
  trailingSlash: true,
};

export default nextConfig;
