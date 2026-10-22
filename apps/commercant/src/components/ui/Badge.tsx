// ============================================================
// SENI CORP — Composant Badge
// Affiche le statut d'un colis avec couleur et icone adaptes
// ============================================================

import { type ReactNode } from "react";
import {
  Clock, Package, Truck, MapPin, CheckCircle2,
  AlertTriangle, XCircle, RotateCcw, Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { statutConfig, type StatutColis } from "@/lib/statuts";

// -- Configuration de chaque statut --
// Associe un statut a son icone Lucide
const STATUT_ICONS: Record<string, typeof Clock> = {
  cree:       Clock,
  pris:       Package,
  transit:    Truck,
  arrive_hub: MapPin,
  attente:    MapPin,
  livraison:  Home,
  livre:      CheckCircle2,
  retarde:    AlertTriangle,
  incident:   AlertTriangle,
  retourne:   RotateCcw,
  perdu:      XCircle,
  annule:     XCircle,
};


// -- Props du composant --
interface BadgeProps {
  // Mode 1 : badge de statut colis (utilise la config automatique)
  statut?: StatutColis;

  // Mode 2 : badge libre avec variante de couleur
  variant?: "emerald" | "bronze" | "terra" | "sage" | "success";

  // Contenu personnalise (remplace le label du statut)
  children?: ReactNode;

  // Classe CSS supplementaire
  className?: string;
}


// -- Couleurs des variantes libres --
const VARIANT_STYLES: Record<string, { bg: string; color: string }> = {
  emerald: { bg: "#E8F0ED", color: "#0B4D3F" },
  bronze:  { bg: "#F5EFE3", color: "#8B6F3D" },
  terra:   { bg: "#FCEEE9", color: "#C66D4F" },
  sage:    { bg: "#E8EDE5", color: "#6B6259" },
  success: { bg: "#E8F0ED", color: "#4A6B5C" },
};


export function Badge({ statut, variant, children, className }: BadgeProps) {
  // Determiner les couleurs et le contenu selon le mode
  let bg: string;
  let color: string;
  let label: ReactNode;
  let Icon: typeof Clock | null = null;

  if (statut) {
    // Mode statut : couleurs et icone automatiques (jamais d'exception sur un statut inconnu)
    const config = statutConfig(statut);
    bg = config.bg;
    color = config.color;
    label = children || config.label;
    Icon = STATUT_ICONS[statut] || null;
  } else if (variant && VARIANT_STYLES[variant]) {
    // Mode variante libre : couleurs manuelles
    const style = VARIANT_STYLES[variant];
    bg = style.bg;
    color = style.color;
    label = children;
  } else {
    // Fallback : style neutre
    bg = "#E8EDE5";
    color = "#6B6259";
    label = children;
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full", className)}
      style={{
        backgroundColor: bg,
        color: color,
        padding: "4px 10px",
        fontFamily: "'Manrope', sans-serif",
        fontSize: "10px",
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {/* Icone du statut (taille 11px pour s'integrer au texte) */}
      {Icon && <Icon size={11} strokeWidth={2} aria-hidden="true" />}

      {label}
    </span>
  );
}
