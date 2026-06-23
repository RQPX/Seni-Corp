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


// -- Generer un tracking number --
// Format : SC-YYYY-XXXXXX (6 caracteres alphanumeriques)
export function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // pas de I, O, 0, 1 (confusion)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SC-${year}-${code}`;
}


// -- Generer un code retrait a 6 chiffres --
// Utilise uniquement des chiffres, affiche par groupes de 3
export function generateCodeRetrait(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code; // affichage : "458 291" fait cote interface
}


// -- Tronquer un texte avec ellipse --
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}
