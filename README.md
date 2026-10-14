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
