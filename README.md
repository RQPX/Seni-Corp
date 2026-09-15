# SENI CORP — Frontend

Interface web de la plateforme logistique SENI CORP (Cote d'Ivoire).
Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.

Le backend NestJS fait autorite sur le contrat d'API. Quand les deux
divergent, c'est le frontend qui a tort.

## API

Backend deploye :

```
https://seni-corp-backend-production.up.railway.app/api/v1
```

```bash
curl https://seni-corp-backend-production.up.railway.app/api/v1/health/ready
# {"status":"ok","base":"ok","latenceMs":8}
```

## Demarrer en local

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

Variables d'environnement (voir `.env.example`) :

| Variable | Role | Valeur |
|---|---|---|
| `BACKEND_ORIGIN` | Origine du backend, **serveur uniquement** | `http://localhost:3001` en local, l'URL Railway sinon |
| `NEXT_PUBLIC_API_URL` | Base de l'API vue du navigateur | `/api/v1` |

`BACKEND_ORIGIN` ne doit **jamais** etre prefixee `NEXT_PUBLIC_` : elle ne
sort pas du serveur. `NEXT_PUBLIC_API_URL` reste un chemin relatif, meme en
production — c'est ce qui rend les cookies first-party.

Le front fonctionne indifféremment contre le backend local ou le backend
deploye : il suffit de changer `BACKEND_ORIGIN`.

## Architecture

### L'API passe par un proxy Next

`next.config.ts` reecrit `/api/v1/*` vers `BACKEND_ORIGIN`. Le front et l'API
partagent donc le meme domaine, ce qui regle trois choses d'un coup :

- les cookies de session deviennent *first-party* (sinon un front sur
  `vercel.app` ne peut pas stocker un cookie pose par `railway.app`) ;
- plus de CORS ;
- `connect-src 'self'` suffit dans la Content-Security-Policy.

### Authentification

Entierement en cookies `httpOnly` : `seni_session` (15 min),
`seni_refresh` (7 jours) et `seni_csrf` (lisible par JS, volontairement).

- **Aucun jeton n'est stocke cote client.** Pas de `localStorage`, jamais.
- Toute ecriture porte l'en-tete `X-CSRF-Token`, recopie depuis `seni_csrf`.
- Sur 401, `src/lib/api.ts` appelle `/auth/refresh` **une seule fois** et
  rejoue la requete. Les rafraichissements concurrents partagent une meme
  promesse : le backend fait tourner les jetons et revoque toute la session
  s'il en voit un reutilise.
- La garde du middleware s'appuie sur **`seni_csrf`**. Ce n'est pas le choix
  qu'on aurait fait spontanement, voir ci-dessous.

### Pourquoi la garde se base sur `seni_csrf`

Le contrat d'API demande de garder `/dashboard` derriere `seni_refresh`. Ce
n'est pas applicable en l'etat : le backend pose ce cookie avec
`Path=/api/v1/auth`, donc le navigateur ne l'envoie **jamais** sur une requete
de page. Une garde basee dessus renvoie l'utilisateur vers `/login` en boucle,
meme connecte (verifie le 15/09/2026, en local et sur Railway).

`seni_session` ne convient pas non plus : `Max-Age=900`, soit 15 minutes.

`seni_csrf` est le seul cookie visible sur `/` dont la duree suit la session
(`Max-Age` 7 jours, pose a la connexion, a l'inscription et a chaque refresh,
efface au logout).

C'est une garde de confort, pas une frontiere de securite : ce cookie est
lisible, donc falsifiable. La vraie protection reste le backend, qui rejette
toute requete sans session valide — un visiteur qui forgerait ce cookie
n'obtiendrait qu'une coquille vide, renvoyee vers `/login` au premier appel
d'API.

> **Cote backend** : exposer `seni_refresh` sur `Path=/` permettrait de
> revenir a la garde prevue par le contrat.

### Donnees

React Query est la **seule** source de verite des donnees metier. Aucun colis,
solde ni transaction ne vit dans un store global ou dans `localStorage`.
Les cles de cache sont centralisees dans `src/lib/queries.ts`.

### Regles non negociables

1. Aucun montant n'est calcule cote client. Les prix viennent de
   `GET /tarifs/calculer` ou de la reponse de `POST /colis`.
2. Aucun numero de suivi n'est genere cote client.
3. Les montants sont des entiers en XOF — le franc CFA n'a pas de sous-unite.
4. Les poids sont envoyes en **kg** et renvoyes en **grammes** (`poidsGrammes`).
5. Le code de retrait d'un colis n'est renvoye qu'une fois, a la creation.
   Il s'affiche, il ne se stocke pas.

## Structure

```
src/
  app/
    login/              Connexion
    inscription/        Creation de compte (particulier ou entreprise)
    dashboard/          Espace client (layout + pages)
  lib/
    api.ts              Client API : CSRF, refresh mutualise, erreurs
    queries.ts          Cles et hooks React Query partages
    statuts.ts          Enumerations, alignees sur le backend
    motDePasse.ts       Politique de mot de passe (miroir du serveur)
    tokens.ts           Design tokens — source unique de la palette
  middleware.ts         CSP, nonce, garde d'authentification
```

## Verifications utiles

- `GET /health/ready` doit repondre `{"status":"ok","base":"ok"}`
- Apres connexion, 3 cookies : `seni_session`, `seni_refresh`, `seni_csrf`
- Un POST sans `X-CSRF-Token` doit renvoyer 403
- Apres 15 min d'inactivite, la navigation doit rester fluide (refresh invisible)
- Cinq onglets ouverts apres expiration doivent rester connectes : sinon c'est
  le bug de rafraichissement concurrent

## Non couvert par le backend

Les **factures** et les **notifications** n'ont pas d'endpoint. Les pages
correspondantes affichent un etat « bientot disponible » — ne pas les
remplir de donnees fictives.

## Scripts

```bash
npm run dev      # serveur de developpement
npm run build    # build de production
npm run start    # sert le build
npm run lint     # ESLint
```
