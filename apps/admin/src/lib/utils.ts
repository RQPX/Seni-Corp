// ============================================================
// SENI CORP — Utilitaires
// Fonctions partagees dans toute l'application
// ============================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// -- cn() : fusionner des classes Tailwind --
// Combine clsx (conditions) et tailwind-merge (resolution de conflits)
// Exemple : cn("px-4 py-2", isActive && "bg-emerald", className)
// Si className contient "px-8", ca remplace "px-4" au lieu de s'additionner
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// -- Formater un montant en XOF --
// Affiche un nombre avec separateurs de milliers
// Exemple : formatMontant(87500) => "87 500"
export function formatMontant(montant: number): string {
  return new Intl.NumberFormat("fr-CI", {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(montant);
}


// -- Formater un poids --
// L'API renvoie des grammes en sortie mais accepte des kg en entree.
export function formatPoids(grammes: number): string {
  return `${(grammes / 1000).toLocaleString("fr", { maximumFractionDigits: 2 })} kg`;
}


// -- Formater une date ISO en DD/MM/YYYY (affichage) --
export function formatDateFr(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR");
}


// -- Tronquer un texte avec ellipse --
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}
