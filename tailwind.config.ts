// ============================================================
// SENI CORP — Configuration Tailwind CSS
// Integre les design tokens dans les classes utilitaires
// Usage : className="bg-emerald text-ivory rounded-card"
// ============================================================

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {

      // -- Palette SENI CORP --
      // Classes generees : bg-emerald, text-bronze, border-sage, etc.
      colors: {
        emerald: {
          DEFAULT: "#0B4D3F",
          dark:    "#083528",
          light:   "#1A6B58",
          soft:    "#E8F0ED",
        },
        bronze: {
          DEFAULT: "#B8935A",
          light:   "#D4B486",
          soft:    "#F5EFE3",
        },
        ivory:      "#FAF6F0",
        sage: {
          DEFAULT: "#E8EDE5",
          dark:    "#D9E0D4",
        },
        anthracite: "#1A1A1A",
        taupe: {
          DEFAULT: "#6B6259",
          light:   "#9B8A7E",
        },
        terra: {
          DEFAULT: "#C66D4F",
          soft:    "#FCEEE9",
        },
        border: {
          DEFAULT:  "#EAE3D5",
          strong:   "#D9D2C5",
          subtle:   "#F0EBE0",
        },
        success:  "#4A6B5C",
        warning:  "#B88838",
        error:    "#A04A3C",
      },

      // -- Polices personnalisees --
      // Classes generees : font-heading, font-body, font-mono
      fontFamily: {
        heading: ["'Manrope'", "sans-serif"],
        body:    ["'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono:    ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },

      // -- Tailles de texte avec line-height integre --
      fontSize: {
        xs:   ["11px", { lineHeight: "16px" }],
        sm:   ["12px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "22px" }],
        md:   ["15px", { lineHeight: "24px" }],
        lg:   ["18px", { lineHeight: "28px" }],
        xl:   ["22px", { lineHeight: "30px" }],
        "2xl":["28px", { lineHeight: "36px" }],
        "3xl":["36px", { lineHeight: "44px" }],
        "4xl":["48px", { lineHeight: "56px" }],
      },

      // -- Coins arrondis --
      // Classes generees : rounded-card, rounded-button, etc.
      borderRadius: {
        tag:    "4px",
        button: "8px",
        card:   "12px",
        modal:  "16px",
        full:   "9999px",
      },

      // -- Ombres teintees emeraude --
      boxShadow: {
        card:    "0 1px 2px rgba(11, 77, 63, 0.06)",
        hover:   "0 4px 12px rgba(11, 77, 63, 0.08)",
        modal:   "0 12px 24px rgba(11, 77, 63, 0.12)",
        overlay: "0 24px 48px rgba(11, 77, 63, 0.16)",
      },

      // -- Largeur maximale du contenu --
      maxWidth: {
        content: "1280px",
        wide:    "1400px",
      },

      // -- Largeur de la sidebar --
      width: {
        sidebar: "256px",
      },

      // -- Transitions coherentes --
      transitionDuration: {
        fast:   "150ms",
        normal: "200ms",
        slow:   "300ms",
        page:   "400ms",
      },

      // -- Opacites --
      opacity: {
        subtle: "0.06",
        muted:  "0.4",
        dim:    "0.6",
      },

      // -- Taille minimum pour les cibles tactiles --
      // Accessibilite : 44px minimum recommande par WCAG
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },

  plugins: [],
};

export default config;
