// L'application metier n'a pas de page publique : tout est derriere la
// connexion. La racine renvoie donc vers l'authentification.

import { redirect } from "next/navigation";

export default function Accueil() {
  redirect("/login");
}
