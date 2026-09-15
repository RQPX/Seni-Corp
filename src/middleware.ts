// ============================================================
// SENI CORP — Middleware
// Ce fichier s'execute AVANT chaque page du site.
// Il fait 3 choses :
//   1. Genere un jeton unique (nonce) pour securiser les scripts
//   2. Applique la Content-Security-Policy (bloque les scripts pirates)
//   3. Garde l'acces au dashboard derriere une session valide
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// -- Verifie si on est en production --
// En dev, on est plus permissif pour laisser marcher les outils de debug
const isProduction = process.env.NODE_ENV === "production";

// -- Cookie sur lequel s'appuie la garde --
//
// Ni seni_session ni seni_refresh ne conviennent ici :
//   - seni_session (Path=/) ne vit que 15 minutes. S'en servir renverrait
//     l'utilisateur vers /login toutes les 15 minutes alors que sa session
//     est encore valide.
//   - seni_refresh porte bien la duree reelle de la session (7 jours) mais
//     le backend le pose avec Path=/api/v1/auth : le navigateur ne l'envoie
//     donc JAMAIS sur une requete de page. Une garde basee dessus redirige
//     en boucle, meme connecte (verifie le 15/09/2026).
//
// seni_csrf est le seul cookie visible sur "/" dont la duree suit celle de
// la session : pose a la connexion, a l'inscription et a chaque refresh,
// efface au logout, Max-Age 7 jours.
//
// C'est une garde de confort, pas une frontiere de securite : ce cookie est
// lisible et donc falsifiable. La vraie protection reste le backend, qui
// rejette toute requete sans session valide — un visiteur qui forgerait ce
// cookie n'obtiendrait qu'une coquille vide renvoyee vers /login au premier
// appel d'API. Si le backend expose un jour seni_refresh sur Path=/, c'est
// lui qu'il faudra utiliser ici.
const SESSION_HINT_COOKIE = "seni_csrf";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // -- Garde d'authentification --
  const session = request.cookies.get(SESSION_HINT_COOKIE);
  const isProtected = pathname.startsWith("/dashboard");
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/inscription");

  if (isProtected && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?session=expired&from=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Deja connecte : on ne montre pas la page de login
  if (isAuthPage && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

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

    // Connexions API : l'API passe par notre propre domaine (proxy Next),
    // donc 'self' suffit. Une source CSP dont le chemin ne finit pas par "/"
    // exige une correspondance exacte : mettre une URL avec chemin ici
    // (".../api/v1") bloquerait tous les appels vers ".../api/v1/auth/login".
    `connect-src 'self' https://*.mapbox.com`,

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
  if (isProduction) {
    response.headers.set("Content-Security-Policy", csp);
  } else {
    response.headers.set("Content-Security-Policy-Report-Only", csp);
  }

  return response;
}

// -- Ou s'applique le middleware --
// On l'applique partout SAUF sur les fichiers statiques (images, CSS...)
// et sauf sur /api/v1 (proxifie vers le backend : ni CSP ni garde a y ajouter).
export const config = {
  // Pas de "missing" ici : la garde d'authentification doit aussi s'appliquer
  // aux requetes de prechargement des <Link>, sinon elle est contournee en
  // continu par la navigation normale du site.
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
