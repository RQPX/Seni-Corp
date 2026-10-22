# SENI CORP — Applications web

Monorepo des interfaces web SENI CORP. Chaque application est autonome :
ses dependances, sa configuration et son build lui appartiennent.

```
apps/
  commercant/   Espace client : creation et suivi de colis, paiements
  admin/        Application metier : traitement des colis, flotte, tournees
```

Le backend NestJS vit dans un depot separe, `RQPX/SENI-CORP-BACKEND`, et
fait autorite sur le contrat d'API.

## Pourquoi deux applications et non une seule

Les publics n'ont rien en commun. Un commercant cree des envois et paie ;
un agent de guichet traite les colis de son agence et encaisse. Melanger
les deux dans une meme application obligerait a masquer la moitie de
l'interface selon le role, et une erreur de condition exposerait des
ecrans d'exploitation a un client.

## Pourquoi chaque application est autonome

Il n'y a volontairement ni espace de travail npm, ni paquet partage.
Railway construit chaque service depuis son propre *Root Directory* :
du code situe en dehors de ce dossier n'existe tout simplement pas au
moment du build.

Le prix a payer est une duplication reduite et assumee : le client API,
les enumerations et les jetons de style sont presents dans les deux
applications. Ces fichiers suivent le contrat du backend ; quand il
change, les deux copies changent.

## Ce que couvre l'application metier

| Ecran | Qui y accede | Ce qu'on y fait |
|---|---|---|
| Colis | agent, chauffeur, dispatch, admin | Trouver un colis et faire avancer son statut |
| Tournees | agent, chauffeur, dispatch, admin | Planifier, composer un manifeste, partir, cloturer |
| Flotte | dispatch, admin | Ajouter un camion, le mettre en maintenance |
| Chauffeurs | dispatch, admin | Tenir a jour les permis, activer ou desactiver |
| Lignes | dispatch, admin | Declarer les trajets desservis |

Deux regles tiennent tout l'ecran des colis :

Les boutons d'action sont construits a partir de `transitionsPossibles`,
que le serveur calcule pour le role de la personne connectee. L'interface
ne redeclare jamais les regles de transition : elles vivent dans la
machine a etats du backend, qui seule fait autorite. Un bouton absent
veut dire que le serveur refuserait l'action.

La portee suit le poste. Un agent ne voit que les colis qui passent par
son agence, un chauffeur ceux de ses tournees. Ce filtrage est fait par
le backend, sur la lecture comme sur l'ecriture. Les gardes de role dans
l'interface ne font qu'eviter de proposer une impasse.

## Demarrer

```bash
cd apps/commercant   # ou apps/admin
npm install
cp .env.example .env.local
npm run dev
```

## Deploiement

Un service Railway par application, chacun avec son *Root Directory* :

| Service | Root Directory |
|---|---|
| Espace client | `apps/commercant` |
| Application metier | `apps/admin` |

Les deux passent par un proxy Next qui relaie `/api/v1` vers le backend
par le reseau prive Railway. Aucune URL absolue vers le backend ne doit
apparaitre dans le code : il n'a pas de domaine public, et un appel
direct perdrait le cookie de session.
