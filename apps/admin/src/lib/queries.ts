// ============================================================
// SENI CORP metier — cles et hooks React Query
//
// Les cles sont centralisees pour qu'une ecriture invalide toutes les
// vues qui lisent la meme donnee. Changer le statut d'un colis doit par
// exemple rafraichir la liste, le detail et le manifeste des tournees.
// ============================================================

'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ajouterColisTournee,
  annulerTournee,
  changerStatutCamion,
  changerStatutColis,
  creerCamion,
  creerLigne,
  creerTournee,
  demarrerTournee,
  getColis,
  getColisDetail,
  getCurrentUser,
  getPointsRelais,
  getCamions,
  getChauffeurs,
  getLignes,
  getMesTournees,
  getStatistiquesReseau,
  getTournees,
  getTournee,
  modifierChauffeur,
  modifierLigne,
  retirerColisTournee,
  terminerTournee,
  type ChangerStatutData,
  type ListeColisParams,
  type StatutCamion,
  type StatutTournee,
} from '@/lib/api';

export const cles = {
  moi: ['auth', 'me'] as const,
  colis: (p: ListeColisParams) => ['colis', p] as const,
  colisDetail: (id: number) => ['colis', 'detail', id] as const,
  pointsRelais: ['points-relais'] as const,
  camions: ['camions'] as const,
  chauffeurs: ['chauffeurs'] as const,
  lignes: ['lignes'] as const,
  tournees: ['tournees'] as const,
  tourneeDetail: (id: number) => ['tournees', 'detail', id] as const,
  statistiques: (depuis: string, jusqua: string) => ['statistiques', depuis, jusqua] as const,
};

export function useUtilisateur() {
  return useQuery({ queryKey: cles.moi, queryFn: getCurrentUser, staleTime: 5 * 60_000 });
}

/**
 * Agregats de l'ecran de pilotage. En changeant de periode, on garde les
 * chiffres precedents a l'ecran le temps que les nouveaux arrivent, au
 * lieu de tout vider.
 */
export function useStatistiquesReseau(depuis: string, jusqua: string) {
  return useQuery({
    queryKey: cles.statistiques(depuis, jusqua),
    queryFn: () => getStatistiquesReseau(depuis, jusqua),
    // Pas de requete tant que la periode n'est pas complete.
    enabled: depuis !== "" && jusqua !== "",
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useColis(params: ListeColisParams) {
  return useQuery({ queryKey: cles.colis(params), queryFn: () => getColis(params) });
}

export function useColisDetail(id: number | null) {
  return useQuery({
    queryKey: cles.colisDetail(id ?? 0),
    queryFn: () => getColisDetail(id!),
    enabled: id !== null,
  });
}

export function usePointsRelais() {
  return useQuery({
    queryKey: cles.pointsRelais,
    queryFn: () => getPointsRelais(),
    staleTime: 10 * 60_000,
  });
}

export function useCamions() {
  return useQuery({ queryKey: cles.camions, queryFn: () => getCamions({ parPage: 100 }) });
}

export function useChauffeurs() {
  return useQuery({ queryKey: cles.chauffeurs, queryFn: () => getChauffeurs({ parPage: 100 }) });
}

export function useLignes() {
  return useQuery({ queryKey: cles.lignes, queryFn: () => getLignes({ parPage: 100 }) });
}

export function useTournees(statut?: StatutTournee, actif = true) {
  return useQuery({
    queryKey: [...cles.tournees, statut ?? 'toutes'],
    queryFn: () => getTournees({ statut, parPage: 50 }),
    enabled: actif,
  });
}

export function useTournee(id: number | null) {
  return useQuery({
    queryKey: cles.tourneeDetail(id ?? 0),
    queryFn: () => getTournee(id!),
    enabled: id !== null,
  });
}

/**
 * Changement de statut d'un colis.
 *
 * Une fois le statut ecrit, la liste, le detail et les manifestes de
 * tournee affichent tous une valeur perimee : on les invalide ensemble
 * plutot que de corriger le cache a la main, ce qui divergerait tot ou
 * tard de ce que le serveur a reellement enregistre.
 */
export function useChangerStatutColis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, donnees }: { id: number; donnees: ChangerStatutData }) =>
      changerStatutColis(id, donnees),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colis'] });
      queryClient.invalidateQueries({ queryKey: cles.tournees });
    },
  });
}

/**
 * Tournees du chauffeur connecte.
 *
 * `actif` est obligatoire parce que la route est reservee au role
 * CHAUFFEUR : un hook ne pouvant pas etre appele conditionnellement, un
 * dispatcher qui ouvre cet ecran declencherait sinon un 403 a chaque
 * rendu. L'appelant decide quelle vue il veut, on ne devine pas le role
 * ici.
 */
export function useMesTournees(statut: StatutTournee | undefined, actif: boolean) {
  return useQuery({
    queryKey: [...cles.tournees, 'miennes', statut ?? 'toutes'],
    queryFn: () => getMesTournees({ statut, parPage: 50 }),
    enabled: actif,
  });
}

/**
 * Invalidation apres une ecriture sur une tournee.
 *
 * Demarrer ou terminer une tournee change AUSSI le statut des colis du
 * manifeste et l'etat du camion : il faut rafraichir les trois familles,
 * sinon l'ecran des colis continue d'afficher l'ancien statut.
 */
function useEcritureTournee<TDonnees, TResultat>(
  action: (donnees: TDonnees) => Promise<TResultat>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cles.tournees });
      queryClient.invalidateQueries({ queryKey: ['colis'] });
      queryClient.invalidateQueries({ queryKey: cles.camions });
    },
  });
}

export function useCreerTournee() {
  return useEcritureTournee(
    (d: { ligneId: number; camionId: number; chauffeurId: number; datePrevue: string }) =>
      creerTournee(d),
  );
}

export function useAjouterColis() {
  return useEcritureTournee((d: { id: number; colisIds: number[] }) =>
    ajouterColisTournee(d.id, d.colisIds),
  );
}

export function useRetirerColis() {
  return useEcritureTournee((d: { id: number; colisId: number }) =>
    retirerColisTournee(d.id, d.colisId),
  );
}

export function useDemarrerTournee() {
  return useEcritureTournee((d: { id: number }) => demarrerTournee(d.id));
}

export function useTerminerTournee() {
  return useEcritureTournee((d: { id: number; note?: string }) =>
    terminerTournee(d.id, d.note),
  );
}

export function useAnnulerTournee() {
  return useEcritureTournee((d: { id: number }) => annulerTournee(d.id));
}

export function useCreerCamion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (d: { immatriculation: string; marque?: string; modele?: string; capaciteKg: number }) =>
      creerCamion(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cles.camions }),
  });
}

export function useChangerStatutCamion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (d: { id: number; statut: StatutCamion }) => changerStatutCamion(d.id, d.statut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cles.camions });
      queryClient.invalidateQueries({ queryKey: cles.tournees });
    },
  });
}

export function useModifierChauffeur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (d: { id: number; numeroPermis?: string; permisExpireLe?: string; actif?: boolean }) =>
      modifierChauffeur(d.id, d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cles.chauffeurs }),
  });
}

export function useCreerLigne() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (d: {
      libelle: string; origineId: number; destinationId: number;
      joursDesserte?: number[]; dureeEstimeeMin: number; heureDepartMinutes?: number | null;
    }) => creerLigne(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cles.lignes }),
  });
}

export function useModifierLigne() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (d: {
      id: number; libelle?: string; joursDesserte?: number[]; dureeEstimeeMin?: number;
      heureDepartMinutes?: number | null; actif?: boolean;
    }) =>
      modifierLigne(d.id, d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cles.lignes }),
  });
}
