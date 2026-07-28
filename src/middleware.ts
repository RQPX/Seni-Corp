// ============================================================
// SENI CORP — Middleware
// Ce fichier s'execute AVANT chaque page/API du site.
// Il fait 3 choses :
//   1. Genere un jeton unique (nonce) pour securiser les scripts
//   2. Applique la Content-Security-Policy (bloque les scripts pirates)
//   3. Ajoute des en-tetes de securite specifiques a chaque requete
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// -- Verifie si on est en production --
// En dev, on est plus permissif pour laisser marcher les outils de debug
const isProduction = process.env.NODE_ENV === "production";

export function middleware(request: NextRequest) {
  // -- Genere un nonce (jeton aleatoire a usage unique) --
  // Ce jeton est ajoute a chaque script/style autorise
  // Un script pirate injecte n'aura PAS ce jeton et sera bloque
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // -- Construction de la Content-Security-Policy --
  // Chaque ligne autorise un type de ressource depuis une source precise
  // Tout le reste est bloque par le navigateur
  const csp = [
    // Par defaut, rien n'est autorise sauf ce qui vient de notre domaine
    `default-src 'self'`,

    // Scripts : seulement ceux qui ont notre nonce
    // 'strict-dynamic' permet aux scripts autorises de charger d'autres scripts
    // 'unsafe-eval' est necessaire en dev pour Next.js hot reload
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
      isProduction ? "" : "'unsafe-eval'"
    }`,

    // Styles : notre domaine + styles inline (necessaire pour les libs UI)
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

    // Polices : notre domaine + Google Fonts
    `font-src 'self' https://fonts.gstatic.com data:`,

    // Images : notre domaine + Mapbox + S3 + data URIs (icones SVG)
    `img-src 'self' data: blob: https://*.mapbox.com https://seni-corp.s3.af-south-1.amazonaws.com`,

    // Connexions API : notre domaine + backend NestJS + services partenaires
    `connect-src 'self' ${
      process.env.NEXT_PUBLIC_API_URL ?? ""
    } https://*.mapbox.com https://api.cinetpay.com https://api.wave.com`,

    // Pas d'objets Flash/Java (obsoletes et dangereux)
    `object-src 'none'`,

    // Base URL : empeche les attaques par injection de <base>
    `base-uri 'self'`,

    // Formulaires : envoyables uniquement vers notre domaine
    `form-action 'self'`,

    // Notre site ne peut pas etre affiche dans une iframe
    `frame-ancestors 'none'`,

    // Force le rechargement en HTTPS des ressources HTTP
    `upgrade-insecure-requests`,
  ]
    .join("; ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // -- Transmet le nonce au layout via un en-tete --
  // Le layout lira ce nonce pour l'appliquer aux scripts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // -- Applique la CSP dans la reponse envoyee au navigateur --
  // En production : mode strict (bloque tout ce qui viole la regle)
  // En dev : mode Report-Only (log les violations sans bloquer)
  // Passer en mode strict quand on est sur qu'aucun script legitime n'est bloque
  if (isProduction) {
    response.headers.set("Content-Security-Policy", csp);
  } else {
    response.headers.set("Content-Security-Policy-Report-Only", csp);
  }

  return response;
}

// -- Ou s'applique le middleware --
// On l'applique partout SAUF sur les fichiers statiques (images, CSS...)
// pour ne pas ralentir le site
export const config = {
  matcher: [
    // Toutes les pages sauf :
    //   - /_next/static  (fichiers Next.js compiles)
    //   - /_next/image   (optimisation d'images)
    //   - /favicon.ico   (icone du site)
    //   - fichiers avec extension (.js, .css, .png, etc.)
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
