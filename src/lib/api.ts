// ================================================================
// Client API SENI CORP — toutes les fonctions pour parler au backend
// L'API tourne sur http://localhost:3001/api/v1
// ================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

// Lit le token JWT sauvegardé dans localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("seni_token");
}

// Fonction générique pour tous les appels API
// Ajoute automatiquement le token si disponible
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Si l'API répond 401, le token est expiré → renvoie vers login
  if (res.status === 401) {
    localStorage.removeItem("seni_token");
    localStorage.removeItem("seni_user");
    window.location.href = "/login";
    throw new Error("Session expirée. Reconnectez-vous.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Erreur API ${res.status}`);
  }

  // 204 No Content → pas de corps JSON
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------

export interface LoginResponse {
  token: string;
  user: { id: number; email: string; nom: string; prenom: string; role: string };
}

// Connexion — sauvegarde le token et les infos user dans localStorage
export async function login(email: string, motDePasse: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, motDePasse }),
  });
  localStorage.setItem("seni_token", data.token);
  localStorage.setItem("seni_user", JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem("seni_token");
  localStorage.removeItem("seni_user");
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("seni_user");
  return raw ? JSON.parse(raw) : null;
}

// ---------------------------------------------------------------
// COLIS
// ---------------------------------------------------------------

export interface Colis {
  id: number;
  tracking: string;
  origineId: number;
  destinationId: number;
  destinataireNom: string;
  destinataireTel: string;
  destinataireAdresse?: string;
  poids: number;
  montant: number;
  statut: string;
  modePaiement: string;
  createdAt: string;
  origine?: { nom: string; ville: string };
  destination?: { nom: string; ville: string };
}

export interface CreateColisData {
  origineId: number;
  destinationId: number;
  destinataireNom: string;
  destinataireTel: string;
  destinataireAdresse?: string;
  poids: number;
  description?: string;
  modePaiement: string;
}

// Crée un nouveau colis (commerçant connecté)
export function creerColis(data: CreateColisData): Promise<Colis> {
  return apiFetch("/colis", { method: "POST", body: JSON.stringify(data) });
}

// Mes colis (commerçant connecté)
export function getMesColis(): Promise<Colis[]> {
  return apiFetch("/colis/mes-colis");
}

// Tous les colis — admin/dispatcher
export function getAllColis(statut?: string): Promise<Colis[]> {
  const q = statut ? `?statut=${statut}` : "";
  return apiFetch(`/colis${q}`);
}

// Suivi public par numéro de tracking
export function suivreColis(tracking: string): Promise<Colis & { evenements: unknown[] }> {
  return apiFetch(`/colis/tracking/${tracking}`);
}

// Change le statut d'un colis
export function updateStatutColis(
  id: number,
  statut: string,
  note?: string,
  localisationId?: number
): Promise<Colis> {
  return apiFetch(`/colis/${id}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut, note, localisationId }),
  });
}

// ---------------------------------------------------------------
// COMMERCANT
// ---------------------------------------------------------------

export interface ProfilCommercant {
  id: number;
  nomBoutique: string;
  soldeCompte: number;
  ville?: string;
  user: { nom: string; prenom: string; email: string; telephone: string };
}

// Profil + solde du commerçant connecté
export function getMonProfil(): Promise<ProfilCommercant> {
  return apiFetch("/commercants/profil");
}

// Recharge le compte prépayé
export function rechargerSolde(montant: number, methode: string) {
  return apiFetch("/commercants/recharger", {
    method: "POST",
    body: JSON.stringify({ montant, methode }),
  });
}

// Historique des transactions
export function getMesTransactions() {
  return apiFetch("/commercants/transactions");
}

// ---------------------------------------------------------------
// POINTS RELAIS
// ---------------------------------------------------------------

export interface PointRelais {
  id: number;
  nom: string;
  type: string;
  ville: string;
  adresse: string;
  telephone: string;
}

export function getPointsRelais(): Promise<PointRelais[]> {
  return apiFetch("/points-relais");
}

// ---------------------------------------------------------------
// TARIFS
// ---------------------------------------------------------------

// Calcule le prix pour un trajet + poids
export function calculerPrix(
  origine: string,
  destination: string,
  poids: number
): Promise<{ prix: number; source: string }> {
  return apiFetch(
    `/tarifs/calculer?origine=${encodeURIComponent(origine)}&destination=${encodeURIComponent(destination)}&poids=${poids}`
  );
}
