// ============================================================
// SENI CORP — Politique de mot de passe
// Miroir de la regle serveur, pour un retour immediat a la saisie.
// C'est le serveur qui tranche : ce fichier ne fait qu'eviter
// un aller-retour reseau pour une erreur evidente.
// ============================================================

export const LONGUEUR_MIN = 12;
export const LONGUEUR_MAX = 128;

// Refus des mots de passe les plus courants. La liste serveur est plus
// large : celle-ci n'attrape que les cas evidents avant l'envoi.
const COURANTS = [
  "password", "motdepasse", "azerty", "qwerty", "123456", "1234567890",
  "abcdefgh", "iloveyou", "admin", "welcome", "senicorp", "letmein",
];

function familles(mdp: string): number {
  return [
    /[a-z]/.test(mdp),
    /[A-Z]/.test(mdp),
    /[0-9]/.test(mdp),
    /[^a-zA-Z0-9]/.test(mdp),
  ].filter(Boolean).length;
}

export interface ContexteMotDePasse {
  nom?: string;
  prenom?: string;
  email?: string;
}

/** Renvoie la liste des problemes, vide si le mot de passe est acceptable. */
export function validerMotDePasse(mdp: string, contexte: ContexteMotDePasse = {}): string[] {
  const erreurs: string[] = [];

  if (mdp.length < LONGUEUR_MIN) {
    erreurs.push(`Le mot de passe doit contenir au moins ${LONGUEUR_MIN} caracteres.`);
  }
  if (mdp.length > LONGUEUR_MAX) {
    erreurs.push(`Le mot de passe ne peut pas depasser ${LONGUEUR_MAX} caracteres.`);
  }

  // Trois familles suffisent, ou bien la longueur compense
  if (mdp.length >= LONGUEUR_MIN && mdp.length < 16 && familles(mdp) < 3) {
    erreurs.push(
      "Utilise au moins 3 types de caracteres (minuscule, majuscule, chiffre, symbole) " +
      "ou choisis un mot de passe de 16 caracteres ou plus."
    );
  }

  const minuscule = mdp.toLowerCase();
  if (COURANTS.some((c) => minuscule.includes(c))) {
    erreurs.push("Ce mot de passe est trop courant.");
  }

  // Un mot de passe qui contient l'identite est devinable
  const morceaux = [
    contexte.nom,
    contexte.prenom,
    contexte.email?.split("@")[0],
  ].filter((v): v is string => !!v && v.length >= 3);

  if (morceaux.some((m) => minuscule.includes(m.toLowerCase()))) {
    erreurs.push("Le mot de passe ne doit pas contenir ton nom, prenom ou email.");
  }

  return erreurs;
}

/** Indicateur visuel : 0 faible, 1 moyen, 2 fort. */
export function forceMotDePasse(mdp: string): 0 | 1 | 2 {
  if (mdp.length < LONGUEUR_MIN) return 0;
  if (mdp.length >= 16 || familles(mdp) >= 4) return 2;
  if (familles(mdp) >= 3) return 1;
  return 0;
}
