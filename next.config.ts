import type { NextConfig } from "next";

// GitHub Pages serveÈ™te un site de proiect sub /<nume-repo>/. Calea vine din
// mediu, ca workflow-ul s-o poatÄƒ seta iar dezvoltarea localÄƒ sÄƒ ruleze la â€ž/".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Export static: fÄƒrÄƒ server, fÄƒrÄƒ rute API, fÄƒrÄƒ Server Actions (principiul 6).
  output: "export",
  basePath,
  // FÄƒrÄƒ optimizare de imagini â€” aceea ar cere un server la rulare.
  images: { unoptimized: true },
  // RÄƒdÄƒcina proiectului, ca sÄƒ nu urce cÄƒutarea pÃ¢nÄƒ Ã®n directorul personal.
  turbopack: { root: import.meta.dirname },
  // Pagini ca /stare/index.html, ca sÄƒ meargÄƒ direct pe GitHub Pages.
  trailingSlash: true,
};

export default nextConfig;

