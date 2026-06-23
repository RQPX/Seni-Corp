// ============================================================
// SENI CORP — Design Tokens
// Source unique de verite pour l'identite visuelle
// Utilise par Tailwind, les composants, et les styles CSS
// ============================================================

// -- Palette de couleurs --
// Inspiree des terres et forets d'Afrique de l'Ouest
// emeraude, bronze, ivoire
export const colors = {
  // Couleur principale — identite, autorite, confiance
  emerald: {
    DEFAULT: "#0B4D3F",
    dark:    "#083528",
    light:   "#1A6B58",
    soft:    "#E8F0ED",   // fond subtil pour badges et highlights
  },

  // Couleur secondaire — luxe, valeur, soleil
  bronze: {
    DEFAULT: "#B8935A",
    light:   "#D4B486",
    soft:    "#F5EFE3",   // fond subtil pour badges bronze
  },

  // Fond principal — plus chaud que le blanc pur
  ivory:   "#FAF6F0",

  // Surfaces secondaires — cartes, zones, panels
  sage: {
    DEFAULT: "#E8EDE5",
    dark:    "#D9E0D4",
  },

  // Texte principal — plus doux que le noir pur
  anthracite: "#1A1A1A",

  // Texte secondaire — legendes, metadonnees
  taupe: {
    DEFAULT: "#6B6259",
    light:   "#9B8A7E",
  },

  // Accent chaleureux — alertes, points d'attention
  terra: {
    DEFAULT: "#C66D4F",
    soft:    "#FCEEE9",
  },

  // Bordures
  border: {
    DEFAULT:  "#EAE3D5",
    strong:   "#D9D2C5",
    subtle:   "#F0EBE0",
  },

  // Semantiques — succes, avertissement, erreur
  success:  "#4A6B5C",
  warning:  "#B88838",
  error:    "#A04A3C",
  disabled: "#9B8A7E",
} as const;


// -- Typographie --
// 3 familles avec des roles bien definis
export const fonts = {
  // Manrope : titres, nombres importants, navigation
  // Sans-serif geometrique moderne, autorite et caractere
  heading: "'Manrope', sans-serif",

  // Inter : corps de texte, formulaires, boutons
  // Concu pour les ecrans, lisibilite maximale
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",

  // JetBrains Mono : tracking numbers, codes retrait, montants
  // Police technique, monospace, identifiable instantanement
  mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
} as const;


// -- Tailles de texte --
// Echelle coherente basee sur une progression de 1.25
export const fontSizes = {
  xs:      "11px",   // micro-texte : badges, tags, timestamps
  sm:      "12px",   // captions, metadonnees, legendes
  base:    "14px",   // texte standard, formulaires
  md:      "15px",   // corps de texte principal
  lg:      "18px",   // sous-titres, labels importants
  xl:      "22px",   // titres de sections
  "2xl":   "28px",   // titres de pages
  "3xl":   "36px",   // hero text
  "4xl":   "48px",   // display
} as const;


// -- Espacements --
// Systeme base sur des multiples de 4px
// Garantit une harmonie visuelle constante
export const spacing = {
  1:  "4px",
  2:  "8px",
  3:  "12px",
  4:  "16px",
  5:  "20px",
  6:  "24px",
  8:  "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;


// -- Coins arrondis --
export const radius = {
  sm:   "4px",    // tags, badges, petits elements
  md:   "8px",    // boutons, inputs
  lg:   "12px",   // cartes, panels
  xl:   "16px",   // modales, larges conteneurs
  full: "9999px", // avatars, boutons ronds
} as const;


// -- Ombres --
// Subtiles, teintees emeraude pour la coherence
export const shadows = {
  sm:   "0 1px 2px rgba(11, 77, 63, 0.06)",
  md:   "0 4px 12px rgba(11, 77, 63, 0.08)",
  lg:   "0 12px 24px rgba(11, 77, 63, 0.12)",
  xl:   "0 24px 48px rgba(11, 77, 63, 0.16)",
} as const;


// -- Breakpoints responsive --
export const breakpoints = {
  sm:  "640px",   // telephone large
  md:  "768px",   // tablette portrait
  lg:  "1024px",  // tablette paysage / laptop
  xl:  "1280px",  // desktop standard
  "2xl": "1536px",// grand ecran
} as const;


// -- Transitions --
export const transitions = {
  fast:   "150ms ease-out",
  normal: "200ms ease-out",
  slow:   "300ms ease-out",
  page:   "400ms ease-out",
} as const;


// -- Statuts colis --
// Configuration visuelle pour chaque statut
// Utilise dans les badges, les timelines, et les filtres
export const colisStatuts = {
  cree:        { label: "Cree",            bg: colors.sage.DEFAULT, color: colors.taupe.DEFAULT },
  pris:        { label: "Pris en charge",  bg: colors.emerald.soft, color: colors.emerald.DEFAULT },
  transit:     { label: "En transit",      bg: colors.bronze.soft,  color: colors.bronze.DEFAULT },
  arrive:      { label: "Arrive relais",   bg: colors.emerald.soft, color: colors.emerald.light },
  livraison:   { label: "En livraison",    bg: colors.bronze.soft,  color: colors.bronze.DEFAULT },
  livre:       { label: "Livre",           bg: colors.emerald.soft, color: colors.success },
  retarde:     { label: "Retarde",         bg: "#FEF3E5",           color: colors.warning },
  annule:      { label: "Annule",          bg: colors.terra.soft,   color: colors.terra.DEFAULT },
  retourne:    { label: "Retourne",        bg: colors.terra.soft,   color: colors.error },
} as const;
