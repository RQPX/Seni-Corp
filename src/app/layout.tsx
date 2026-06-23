// ============================================================
// SENI CORP — Layout racine
// Ce fichier enveloppe toutes les pages de l'application.
// Il charge les polices Google Fonts et les styles globaux.
// ============================================================

import type { Metadata, Viewport } from "next";
import { Manrope, Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";

// -- Chargement des polices via next/font --
// Next.js les heberge localement pour eviter les appels a Google Fonts
// et ameliorer les performances (pas de flash de texte non style)

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",     // accessible via font-heading dans Tailwind
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",        // accessible via font-body dans Tailwind
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",        // accessible via font-mono dans Tailwind
  weight: ["400", "500", "600"],
});

// -- Metadonnees de la page (SEO, onglet navigateur) --
export const metadata: Metadata = {
  title: "SENI CORP — Plateforme logistique",
  description: "Plateforme de transport de marchandises en Cote d'Ivoire",
};

// -- Viewport : empeche le dezoom sous 100% mais autorise le zoom en avant --
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
};

// -- Layout racine --
// Applique les variables CSS des polices sur le <html>
// pour qu'elles soient disponibles partout dans l'application
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body
        style={{
          fontFamily: "var(--font-body)",
          backgroundColor: "#FAF6F0",
          color: "#1A1A1A",
        }}
      >
        {children}
      </body>
    </html>
  );
}
