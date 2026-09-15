// ============================================================
// SENI CORP — Composant FilterTabs
// Un selecteur de filtre intelligent :
//   - Sur desktop et tablette : des pilules horizontales cliquables
//   - Sur telephone : un vrai menu deroulant natif (plus facile a taper)
// Ca corrige le probleme "les filtres ne s'affichent pas bien sur mobile"
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// Couleurs de la marque (extrait pour ce composant)
const C = {
  emerald: "#0B4D3F",
  ivory: "#FAF6F0",
  sage: "#E8EDE5",
  white: "#FFFFFF",
  border: "#EAE3D5",
  taupe: "#6B6259",
  anthracite: "#1A1A1A",
};

// -- Structure d'une option de filtre --
export type FilterOption = {
  value: string;      // valeur interne (ex: "livre")
  label: string;      // texte affiche (ex: "Livres")
  count?: number;     // nombre optionnel affiche a droite
};

interface FilterTabsProps {
  // Liste des filtres disponibles
  options: FilterOption[];

  // Valeur actuellement selectionnee
  value: string;

  // Fonction appelee quand l'utilisateur change de filtre
  onChange: (value: string) => void;

  // Etiquette pour l'accessibilite (lecteurs d'ecran)
  ariaLabel?: string;
}

export function FilterTabs({ options, value, onChange, ariaLabel = "Filtrer" }: FilterTabsProps) {
  // -- Detection : est-on sur un petit ecran (mobile) ? --
  // On regarde la largeur de la fenetre en JavaScript
  // useState avec valeur par defaut = false pour eviter les problemes de SSR
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Meme point de rupture que le layout du dashboard (Tailwind md, 768px) :
    // sinon entre 640 et 767px on a la nav mobile ET les pilules desktop.
    const mq = window.matchMedia("(max-width: 767px)");

    // Mise a jour immediate au chargement
    setIsMobile(mq.matches);

    // Ecoute les changements (rotation de l'ecran, resize desktop)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);

    // Nettoyage : on retire l'ecouteur quand le composant disparait
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Trouver le libelle de la valeur active (pour le select mobile)
  const activeOption = options.find((o) => o.value === value);

  // =========================================================
  // VERSION MOBILE : menu deroulant natif du systeme
  // =========================================================
  // On utilise le <select> natif car :
  //   - Il fonctionne parfaitement sur iOS et Android
  //   - Il ouvre le picker natif (plus facile a manipuler au doigt)
  //   - Il est accessible par defaut
  //   - Pas de probleme de "dropdown cache par un autre element"
  if (isMobile) {
    return (
      <div className="relative w-full mb-4">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
          className="w-full rounded-xl"
          style={{
            padding: "12px 40px 12px 16px",
            fontSize: "15px",
            fontFamily: "var(--font-heading)",
            fontWeight: 600,
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            color: C.anthracite,
            // La hauteur minimum garantit une cible tactile confortable (44px)
            minHeight: "48px",
            // On enleve l'apparence par defaut (le chevron systeme)
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
              {opt.count !== undefined ? ` (${opt.count})` : ""}
            </option>
          ))}
        </select>

        {/* Chevron dessine en SVG, positionne a droite */}
        <ChevronDown
          size={18}
          strokeWidth={2}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
          style={{ color: C.taupe }}
          aria-hidden="true"
        />
      </div>
    );
  }

  // =========================================================
  // VERSION DESKTOP / TABLETTE : pilules cliquables
  // =========================================================
  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4"
      role="tablist"
      aria-label={ariaLabel}
      // scroll snap : les pilules s'accrochent joliment quand on scrolle
      style={{ scrollSnapType: "x proximity" }}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className="flex items-center gap-1.5 rounded-full shrink-0"
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              fontFamily: "var(--font-heading)",
              fontWeight: isActive ? 700 : 500,
              backgroundColor: isActive ? C.emerald : C.white,
              color: isActive ? C.ivory : C.taupe,
              border: `1px solid ${isActive ? C.emerald : C.border}`,
              cursor: "pointer",
              minHeight: "40px",         // cible tactile suffisante
              scrollSnapAlign: "start",  // accroche du scroll
              transition: "all 150ms ease-out",
            }}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                style={{
                  fontSize: "11px",
                  backgroundColor: isActive ? "rgba(255,255,255,0.2)" : C.sage,
                  padding: "1px 7px",
                  borderRadius: "8px",
                  fontWeight: 700,
                }}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
