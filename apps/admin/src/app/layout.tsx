// ============================================================
// SENI CORP metier — Layout racine
// ============================================================

import type { Metadata, Viewport } from "next";
import { Manrope, Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Providers } from "./providers";
import "@/styles/globals.css";

const manrope = Manrope({
  subsets: ["latin"], display: "swap", variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
});
const inter = Inter({
  subsets: ["latin"], display: "swap", variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"], display: "swap", variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SENI CORP — Exploitation",
  description: "Application metier SENI CORP",
  applicationName: "SENI CORP Exploitation",
  // Un outil interne n'a rien a faire dans un moteur de recherche.
  robots: { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0B4D3F" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="fr" className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body
        style={{ fontFamily: "var(--font-body)", backgroundColor: "#FAF6F0", color: "#1A1A1A" }}
        data-nonce={nonce}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
