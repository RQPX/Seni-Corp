// ============================================================
// SENI CORP — Composant Button
// Bouton reutilisable avec variantes, tailles et etats
// Utilise class-variance-authority (cva) pour gerer les variantes
// ============================================================

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// -- Definition des variantes avec cva --
// Chaque variante correspond a un cas d'usage precis
const buttonVariants = cva(
  // Classes de base communes a tous les boutons
  [
    "inline-flex items-center justify-center gap-2",
    "font-heading font-semibold",        // police Manrope
    "rounded-button",                     // coins arrondis 8px
    "transition-all duration-fast",       // transition rapide
    "cursor-pointer select-none",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus-visible:outline-2 focus-visible:outline-bronze focus-visible:outline-offset-2",
    "min-h-touch",                        // 44px minimum pour l'accessibilite tactile
  ].join(" "),
  {
    variants: {
      // -- Variantes visuelles --
      variant: {
        // Action principale : fond emeraude, texte ivoire
        primary: "bg-emerald text-ivory hover:bg-emerald-dark active:bg-emerald-dark",

        // Action secondaire : bordure emeraude, fond transparent
        secondary: [
          "bg-transparent text-emerald",
          "border border-emerald",
          "hover:bg-emerald-soft",
        ].join(" "),

        // Action tertiaire : texte seul sans fond ni bordure
        tertiary: "bg-transparent text-emerald hover:bg-emerald-soft",

        // Action premium : fond bronze pour les elements de valeur
        bronze: "bg-bronze text-white hover:brightness-110 active:brightness-95",

        // Action destructive : suppression, annulation
        destructive: [
          "bg-transparent text-terra",
          "border border-terra",
          "hover:bg-terra-soft",
        ].join(" "),

        // Bouton fantome : pas de fond, hover subtil
        ghost: "bg-transparent text-taupe hover:bg-sage hover:text-anthracite",
      },

      // -- Tailles --
      size: {
        // Compact : dans les tableaux, barres d'outils
        sm: "text-xs px-3 py-1.5 min-h-[32px]",

        // Standard : la plupart des cas
        md: "text-sm px-4 py-2 min-h-[40px]",

        // Grand : actions principales, hero, CTA
        lg: "text-base px-6 py-2.5 min-h-[48px]",

        // Icone seule : boutons carres sans texte
        icon: "p-2 min-h-touch min-w-touch",
      },

      // -- Pleine largeur --
      fullWidth: {
        true: "w-full",
      },
    },

    // -- Valeurs par defaut --
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);


// -- Types du composant --
// Combine les props HTML natifs avec les variantes cva
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // Indicateur de chargement (affiche un spinner a la place du contenu)
  loading?: boolean;
}


// -- Composant Button --
// forwardRef pour permettre l'acces au DOM natif (refs, focus, etc.)
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {/* Spinner de chargement */}
        {loading && (
          <svg
            className="animate-spin"
            style={{ width: "16px", height: "16px" }}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="60"
              strokeDashoffset="20"
            />
          </svg>
        )}

        {/* Contenu du bouton (texte + icone eventuelle) */}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
