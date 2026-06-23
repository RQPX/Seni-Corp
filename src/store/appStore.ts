// ============================================================
// Store global SENI CORP — Zustand avec persistance localStorage
// Centralise : liste des colis, solde du compte, transactions
// Toutes les pages lisent et ecrivent ici pour rester synchrones
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// -- Types --
export type ColisItem = {
  tracking: string;
  origine: string;
  destination: string;
  destinataire: string;
  telephone: string;
  statut: string;
  montant: number;
  date: string;
  poids: string;
  contenu: string;
  service: string;
};

export type Transaction = {
  id: number;
  type: "recharge" | "debit" | "remboursement";
  desc: string;
  montant: number;
  date: string;
  statut: "ok" | "attente";
};

// -- Donnees de demonstration initiales --
const DEMO_COLIS: ColisItem[] = [
  { tracking: "SC-2026-A8K4M2", origine: "Abidjan",  destination: "Korhogo",      destinataire: "Fatou Diallo",      telephone: "+225 07 89 12 34", statut: "livre",   montant: 3200, date: "27/04/2026", poids: "2,5 kg", contenu: "Vetements (3 ensembles)",  service: "Point relais" },
  { tracking: "SC-2026-B2F7N9", origine: "Abidjan",  destination: "Bouake",       destinataire: "Mamadou Toure",     telephone: "+225 05 67 89 01", statut: "relais",  montant: 2100, date: "27/04/2026", poids: "1,2 kg", contenu: "Accessoires telephone",     service: "Point relais" },
  { tracking: "SC-2026-C5R3X1", origine: "Abidjan",  destination: "Yamoussoukro", destinataire: "Adjoua Kouassi",    telephone: "+225 07 45 23 67", statut: "transit", montant: 1800, date: "26/04/2026", poids: "3,0 kg", contenu: "Cosmetiques",              service: "Livraison domicile" },
  { tracking: "SC-2026-D9P2L8", origine: "Abidjan",  destination: "San-Pedro",    destinataire: "Aminata Bamba",     telephone: "+225 01 23 45 67", statut: "cree",    montant: 2500, date: "27/04/2026", poids: "0,8 kg", contenu: "Bijoux",                   service: "Point relais" },
  { tracking: "SC-2026-E4Q8M3", origine: "Korhogo",  destination: "Abidjan",      destinataire: "Jean-Luc Assi",     telephone: "+225 07 98 76 54", statut: "transit", montant: 1950, date: "26/04/2026", poids: "1,5 kg", contenu: "Tissu Pagne",              service: "Point relais" },
  { tracking: "SC-2026-F7H2K5", origine: "Abidjan",  destination: "Bouake",       destinataire: "Awa Traore",        telephone: "+225 05 11 22 33", statut: "livre",   montant: 1600, date: "25/04/2026", poids: "0,5 kg", contenu: "Documents",                service: "Point relais" },
  { tracking: "SC-2026-G3L9N1", origine: "Abidjan",  destination: "Daloa",        destinataire: "Salimata Diomande", telephone: "+225 07 44 55 66", statut: "retarde", montant: 2800, date: "24/04/2026", poids: "4,2 kg", contenu: "Pieces detachees",         service: "Livraison domicile" },
  { tracking: "SC-2026-H6T4P9", origine: "Bouake",   destination: "Korhogo",      destinataire: "Issouf Ouattara",   telephone: "+225 05 77 88 99", statut: "livre",   montant: 1400, date: "24/04/2026", poids: "1,0 kg", contenu: "Chaussures",               service: "Point relais" },
  { tracking: "SC-2026-I8R2M4", origine: "Abidjan",  destination: "Korhogo",      destinataire: "Kadiatou Kone",     telephone: "+225 07 33 44 55", statut: "annule",  montant: 3500, date: "23/04/2026", poids: "5,0 kg", contenu: "Electronique",             service: "Livraison domicile" },
  { tracking: "SC-2026-J9F3K7", origine: "Abidjan",  destination: "Bouake",       destinataire: "Ibrahim Coulibaly", telephone: "+225 01 66 77 88", statut: "livre",   montant: 1750, date: "23/04/2026", poids: "2,0 kg", contenu: "Alimentaire",              service: "Point relais" },
];

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 1, type: "recharge",      desc: "Recharge via CinetPay (Wave)",   montant:  50000, date: "27/04/2026 10:15", statut: "ok" },
  { id: 2, type: "debit",         desc: "Colis SC-2026-A8K4M2",          montant:  -3200, date: "27/04/2026 14:23", statut: "ok" },
  { id: 3, type: "debit",         desc: "Colis SC-2026-B2F7N9",          montant:  -2100, date: "27/04/2026 14:30", statut: "ok" },
  { id: 4, type: "recharge",      desc: "Recharge via CinetPay (OM)",    montant:  25000, date: "25/04/2026 09:05", statut: "ok" },
  { id: 5, type: "debit",         desc: "Colis SC-2026-C5R3X1",          montant:  -1800, date: "26/04/2026 08:12", statut: "ok" },
  { id: 6, type: "remboursement", desc: "Remboursement SC-2026-I8R2M4",  montant:   3500, date: "24/04/2026 15:40", statut: "ok" },
  { id: 7, type: "debit",         desc: "Colis SC-2026-D9P2L8",          montant:  -2500, date: "27/04/2026 15:10", statut: "attente" },
  { id: 8, type: "recharge",      desc: "Recharge via CinetPay (Wave)",   montant:  30000, date: "22/04/2026 11:30", statut: "ok" },
];

// Formate la date/heure actuelle en DD/MM/YYYY HH:mm
function nowDatetime(): string {
  const d = new Date();
  const dd  = String(d.getDate()).padStart(2, '0');
  const mm  = String(d.getMonth() + 1).padStart(2, '0');
  const hh  = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`;
}

// -- Interface du store --
type AppStore = {
  colis: ColisItem[];
  solde: number;
  transactions: Transaction[];

  // Ajoute un nouveau colis en tete de liste
  addColis: (colis: ColisItem) => void;

  // Debite le solde et enregistre la transaction correspondante
  deductSolde: (amount: number, tracking: string) => void;

  // Credite le solde et enregistre la transaction de recharge
  rechargeSolde: (amount: number, method: string) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      colis: DEMO_COLIS,
      solde: 87500,
      transactions: DEMO_TRANSACTIONS,

      addColis: (colis) =>
        set((state) => ({ colis: [colis, ...state.colis] })),

      deductSolde: (amount, tracking) =>
        set((state) => ({
          solde: Math.max(0, state.solde - amount),
          transactions: [
            {
              id: Date.now(),
              type: "debit" as const,
              desc: `Colis ${tracking}`,
              montant: -amount,
              date: nowDatetime(),
              statut: "ok" as const,
            },
            ...state.transactions,
          ],
        })),

      rechargeSolde: (amount, method) =>
        set((state) => ({
          solde: state.solde + amount,
          transactions: [
            {
              id: Date.now(),
              type: "recharge" as const,
              desc: `Recharge via ${method}`,
              montant: amount,
              date: nowDatetime(),
              statut: "ok" as const,
            },
            ...state.transactions,
          ],
        })),
    }),
    // Sauvegarde dans localStorage pour survivre aux rechargements de page
    { name: 'seni-corp-store' }
  )
);
