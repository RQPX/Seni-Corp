// ============================================================
// SENI CORP — Enumerations : SOURCE UNIQUE DE VERITE
// Les valeurs doivent correspondre exactement aux enums du backend.
// Aucune valeur ne s'invente ici : si une cle manque, c'est cote
// backend qu'il faut l'ajouter d'abord.
// ============================================================

// -- Statuts de colis (11) --
export const STATUTS = {
  CREE:               { label: "Cree",               bg: "#E8EDE5", color: "#6B6259", ordre: 1 },
  PRIS_EN_CHARGE:     { label: "Pris en charge",     bg: "#E8F0ED", color: "#0B4D3F", ordre: 2 },
  EN_TRANSIT:         { label: "En transit",         bg: "#F5EFE3", color: "#8B6F3D", ordre: 3 },
  ARRIVE_HUB:         { label: "Arrive au hub",      bg: "#E8F0ED", color: "#1A6B58", ordre: 4 },
  EN_ATTENTE_RETRAIT: { label: "En attente retrait", bg: "#E8F0ED", color: "#1A6B58", ordre: 5 },
  EN_LIVRAISON:       { label: "En livraison",       bg: "#F5EFE3", color: "#8B6F3D", ordre: 6 },
  LIVRE:              { label: "Livre",              bg: "#E8F0ED", color: "#4A6B5C", ordre: 7 },
  RETOURNE:           { label: "Retourne",           bg: "#FCEEE9", color: "#A04A3C", ordre: 0 },
  PERDU:              { label: "Perdu",              bg: "#FCEEE9", color: "#A04A3C", ordre: 0 },
  INCIDENT:           { label: "Incident",           bg: "#FCEEE9", color: "#C66D4F", ordre: 0 },
  ANNULE:             { label: "Annule",             bg: "#FCEEE9", color: "#C66D4F", ordre: 0 },
} as const;

export type StatutColis = keyof typeof STATUTS;

// Ordre d'avancement normal (pour les timelines de suivi)
export const PARCOURS: StatutColis[] = [
  "CREE", "PRIS_EN_CHARGE", "EN_TRANSIT", "ARRIVE_HUB",
  "EN_ATTENTE_RETRAIT", "EN_LIVRAISON", "LIVRE",
];

// Statuts exceptionnels, hors parcours
export const STATUTS_EXCEPTION: StatutColis[] = [
  "RETOURNE", "PERDU", "INCIDENT", "ANNULE",
];

// Toujours passer par cette fonction : jamais STATUTS[x] directement,
// pour ne pas planter sur un statut inconnu venant de l'API.
export function statutConfig(statut: string) {
  return STATUTS[statut as StatutColis]
    ?? { label: statut, bg: "#E8EDE5", color: "#6B6259", ordre: 0 };
}


// -- Roles --
// Le role "COMMERCANT" n'existe plus : CLIENT couvre desormais
// les particuliers comme les entreprises.
export const ROLES = ["CLIENT", "AGENT", "CHAUFFEUR", "DISPATCHER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

// -- Type de client --
export const TYPES_CLIENT = ["PARTICULIER", "ENTREPRISE"] as const;
export type TypeClient = (typeof TYPES_CLIENT)[number];

// -- Type de service --
export const TYPES_SERVICE = ["RELAIS", "DOMICILE"] as const;
export type TypeService = (typeof TYPES_SERVICE)[number];

export const LABELS_SERVICE: Record<TypeService, string> = {
  RELAIS: "Point relais",
  DOMICILE: "Livraison a domicile",
};

// -- Modes de paiement --
export const MODES_PAIEMENT = ["SOLDE", "CINETPAY", "COD"] as const;
export type ModePaiement = (typeof MODES_PAIEMENT)[number];

export const LABELS_PAIEMENT: Record<ModePaiement, string> = {
  SOLDE: "Solde du compte",
  CINETPAY: "CinetPay",
  COD: "Paiement a la livraison",
};

// -- Transactions --
export const STATUTS_TRANSACTION = ["ATTENTE", "CONFIRME", "ECHEC", "REJETEE"] as const;
export type StatutTransaction = (typeof STATUTS_TRANSACTION)[number];

export const LABELS_STATUT_TRANSACTION: Record<StatutTransaction, string> = {
  ATTENTE: "En attente",
  CONFIRME: "Confirme",
  ECHEC: "Echec",
  REJETEE: "Rejetee",
};

export const TYPES_TRANSACTION = ["RECHARGE", "DEBIT", "REMBOURSEMENT", "COMMISSION"] as const;
export type TypeTransaction = (typeof TYPES_TRANSACTION)[number];

export const LABELS_TYPE_TRANSACTION: Record<TypeTransaction, string> = {
  RECHARGE: "Recharge",
  DEBIT: "Debit",
  REMBOURSEMENT: "Remboursement",
  COMMISSION: "Commission",
};
