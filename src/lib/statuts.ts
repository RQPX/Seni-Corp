// ============================================================
// SENI CORP — Statuts colis : SOURCE UNIQUE
// Doit correspondre exactement a l'enum du backend NestJS.
// ============================================================

export const STATUTS = {
  cree:        { label: "Cree",              bg: "#E8EDE5", color: "#6B6259", ordre: 1 },
  pris:        { label: "Pris en charge",     bg: "#E8F0ED", color: "#0B4D3F", ordre: 2 },
  transit:     { label: "En transit",         bg: "#F5EFE3", color: "#8B6F3D", ordre: 3 },
  arrive_hub:  { label: "Arrive hub",         bg: "#E8F0ED", color: "#1A6B58", ordre: 4 },
  attente:     { label: "En attente retrait", bg: "#E8F0ED", color: "#1A6B58", ordre: 5 },
  livraison:   { label: "En livraison",       bg: "#F5EFE3", color: "#8B6F3D", ordre: 6 },
  livre:       { label: "Livre",              bg: "#E8F0ED", color: "#4A6B5C", ordre: 7 },
  retarde:     { label: "Retarde",            bg: "#FEF3E5", color: "#B88838", ordre: 0 },
  incident:    { label: "Incident",           bg: "#FCEEE9", color: "#C66D4F", ordre: 0 },
  retourne:    { label: "Retourne",           bg: "#FCEEE9", color: "#A04A3C", ordre: 0 },
  perdu:       { label: "Perdu",              bg: "#FCEEE9", color: "#A04A3C", ordre: 0 },
  annule:      { label: "Annule",             bg: "#FCEEE9", color: "#C66D4F", ordre: 0 },
} as const;

export type StatutColis = keyof typeof STATUTS;

// Ordre d'avancement normal (pour les timelines de suivi)
export const PARCOURS: StatutColis[] = [
  "cree", "pris", "transit", "arrive_hub", "attente", "livraison", "livre",
];

// Statuts exceptionnels, hors parcours
export const STATUTS_EXCEPTION: StatutColis[] = [
  "retarde", "incident", "retourne", "perdu", "annule",
];

// Toujours passer par cette fonction : jamais STATUTS[x] directement,
// pour ne pas planter sur un statut inconnu venant de l'API.
export function statutConfig(statut: string) {
  return STATUTS[statut as StatutColis]
    ?? { label: statut, bg: "#E8EDE5", color: "#6B6259", ordre: 0 };
}
