// ============================================================
// SENI CORP — Layout racine
// C'est le "cadre" qui entoure toutes les pages du site.
// Il fait 4 choses importantes :
//   1. Charge les polices (Manrope, Inter, JetBrains Mono)
//   2. Configure le viewport pour bien s'afficher sur mobile
//   3. Recupere le nonce de securite du middleware
//   4. Definit le titre et la description du site
// ============================================================

import type { Metadata, Viewport } from "next";
import { Manrope, Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Providers } from "./providers";
import "@/styles/globals.css";

// -- Chargement des polices depuis Google Fonts --
// next/font les telecharge une fois et les stocke localement
// pour un chargement rapide et sans flash de texte non stylise
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

// -- Metadonnees du site --
// Ce qui apparait dans l'onglet du navigateur, les partages, Google
export const metadata: Metadata = {
  title: "SENI CORP — Plateforme logistique",
  description: "Plateforme de transport de marchandises en Cote d'Ivoire",
  applicationName: "SENI CORP",
  robots: {
    // On empeche l'indexation de l'espace commercant par les moteurs de recherche
    index: false,
    follow: false,
  },
  formatDetection: {
    // Empeche iOS de convertir automatiquement les numeros en liens tel:
    telephone: false,
  },
};

// -- Reglages du viewport (l'affichage sur mobile) --
// C'est ICI que se joue le fix responsive :
//   - width: device-width : la page s'adapte a la largeur exacte de l'ecran
//   - initialScale: 1 : on ne zoome pas au chargement
//   - viewportFit: 'cover' : la page va JUSQU'AUX bords, meme avec encoche iPhone
//   - PAS de maximumScale : on laisse l'utilisateur zoomer (accessibilite)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  // IMPORTANT : on ne bloque plus le zoom (accessibilite pour malvoyants)
  // maximumScale retire volontairement
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6F0" },
    { media: "(prefers-color-scheme: dark)",  color: "#0B4D3F" },
  ],
};

// -- Layout racine --
// Cette fonction enveloppe TOUTES les pages du site
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // -- Recupere le nonce genere par le middleware --
  // Ce nonce sera utilise par la Content-Security-Policy
  // pour autoriser uniquement nos scripts (bloque les scripts pirates)
  const nonce = (await headers()).get("x-nonce") ?? undefined;

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
        // Injecte le nonce pour que les scripts Next.js legitimes soient autorises
        data-nonce={nonce}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
