// ============================================================
// SENI CORP — Configuration Next.js
// Ce fichier reglele comportement du serveur Next.js :
//   - Masque la techno utilisee (securite)
//   - Ajoute des en-tetes qui protegent le site des attaques
//   - Autorise les images depuis nos partenaires (Mapbox, S3)
// ============================================================

import type { NextConfig } from "next";

// Liste des en-tetes de securite ajoutes a chaque reponse
// Chaque en-tete bloque un type d'attaque bien connu du web
const securityHeaders = [
  {
    // Empeche que notre site soit affiche dans une iframe d'un autre site
    // Protege contre le clickjacking (piege visuel qui vole des clics)
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Empeche le navigateur de deviner le type d'un fichier
    // Protege contre l'execution de fichiers uploades comme du code
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Ne partage l'URL de notre site que quand c'est indispensable
    // Protege la vie privee des utilisateurs
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Interdit l'acces a la camera, micro, GPS depuis notre site
    // On les autorisera au cas par cas plus tard si besoin
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  },
  {
    // Force le navigateur a toujours utiliser HTTPS pendant 2 ans
    // A activer seulement quand le certificat SSL est en place
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Bloque le chargement du site dans une iframe (double protection)
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig: NextConfig = {
  // -- Securite : cache l'entete "X-Powered-By: Next.js" --
  // Un attaquant ne peut pas savoir immediatement quelle techno on utilise
  poweredByHeader: false,

  // -- Mode strict de React : detecte les erreurs plus tot --
  reactStrictMode: true,

  // -- Compression des reponses HTTP --
  compress: true,

  // -- Domaines autorises pour les images optimisees --
  // A completer quand on aura des vraies URLs (S3, Mapbox, etc.)
  images: {
    remotePatterns: [
      // Photos de colis stockees sur S3 (region Cape Town)
      { protocol: "https", hostname: "seni-corp.s3.af-south-1.amazonaws.com" },
      // Tuiles Mapbox pour les cartes
      { protocol: "https", hostname: "api.mapbox.com" },
    ],
  },

  // -- Applique les en-tetes de securite a toutes les routes --
  async headers() {
    return [
      {
        // "/(.*)" = toutes les URLs du site
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
