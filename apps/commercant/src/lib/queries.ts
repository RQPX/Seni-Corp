// ============================================================
// SENI CORP — Cles et hooks React Query partages
// Centralise les cles pour que l'invalidation apres une ecriture
// touche bien toutes les pages qui lisent la meme donnee.
// ============================================================

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getColis,
  getCurrentUser,
  getPointsRelais,
  getProfil,
  getTransactions,
  type ListeColisParams,
} from "@/lib/api";

export const cles = {
  moi: ["auth", "me"] as const,
  profil: ["clients", "profil"] as const,
  colis: (params: ListeColisParams) => ["colis", params] as const,
  transactions: (page: number, parPage: number) => ["clients", "transactions", page, parPage] as const,
  pointsRelais: ["points-relais"] as const,
};

export function useUtilisateur() {
  return useQuery({ queryKey: cles.moi, queryFn: getCurrentUser, staleTime: 5 * 60_000 });
}

export function useProfil() {
  return useQuery({ queryKey: cles.profil, queryFn: getProfil });
}

export function useColis(params: ListeColisParams) {
  return useQuery({ queryKey: cles.colis(params), queryFn: () => getColis(params) });
}

export function useTransactions(page = 1, parPage = 20) {
  return useQuery({
    queryKey: cles.transactions(page, parPage),
    queryFn: () => getTransactions(page, parPage),
  });
}

export function usePointsRelais() {
  return useQuery({
    queryKey: cles.pointsRelais,
    queryFn: () => getPointsRelais(),
    // La liste des relais bouge tres rarement
    staleTime: 10 * 60_000,
  });
}
