// ============================================================
// SENI CORP — Providers clients
// React Query est la source de verite des donnees metier.
// Aucune donnee de colis, de solde ou de transaction ne doit
// vivre ailleurs (ni store global, ni localStorage).
// ============================================================

"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Court, parce que la base peut bouger sans passer par l'interface
            // (un colis supprime en SQL, un statut change par un agent).
            staleTime: 10_000,
            // Revenir sur l'onglet relit les donnees : sans ca, un changement
            // fait ailleurs reste invisible tant qu'on ne recharge pas la page.
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchOnReconnect: true,
            // Inutile de reessayer une erreur metier : seules les pannes
            // reseau et les 5xx valent une seconde tentative.
            retry: (nbEchecs, erreur) => {
              if (erreur instanceof ApiError && erreur.status >= 400 && erreur.status < 500) {
                return false;
              }
              return nbEchecs < 2;
            },
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
