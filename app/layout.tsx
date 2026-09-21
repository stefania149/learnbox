import type { Metadata } from "next";
import "./globals.css";

const descriere =
  "Un joc de învățat, care rulează întreg în browser: Python, exerciții cu " +
  "verdict mecanic și progres păstrat local. Fără server, fără cont.";

export const metadata: Metadata = {
  title: "Tutore",
  description: descriere,
  openGraph: {
    title: "Tutore",
    description: descriere,
    locale: "ro_RO",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
