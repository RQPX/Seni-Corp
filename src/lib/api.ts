// ================================================================
// SENI CORP — Client API
// Ce fichier contient toutes les fonctions qui parlent au backend.
// Il gere aussi la connexion et la deconnexion de facon securisee.
//
// IMPORTANT SECURITE :
// - Le jeton d'authentification (JWT) est stocke dans un cookie
//   "HttpOnly" et "Secure" cote backend. Le frontend NE VOIT PAS
//   le jeton (impossible de le voler via une faille XSS).
// - Chaque requete est envoyee avec `credentials: "include"` pour
//   que le navigateur envoie automatiquement le cookie.
// ================================================================

// -- URL du backend --
// Priorite : variable d'environnement > valeur par defaut
// En dev local : http://localhost:3001/api/v1 (backend NestJS)
// En prod      : https://api.seni-corp.ci/v1 (a configurer via env)
// Ne JAMAIS committer une URL de prod en dur ici
function getApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // En production, si l'URL n'est pas definie, c'est une erreur de config
  // On log l'alerte et on echoue clairement plutot que d'utiliser localhost
  if (!envUrl && process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-console
    console.error(
      "[SENI CORP] NEXT_PUBLIC_API_URL manquante en production. " +
      "L'application ne peut pas contacter le backend."
    );
    return ""; // les appels API echoueront visiblement au lieu d'aller sur localhost
  }

  return envUrl ?? "http://localhost:3001/api/v1";
}

const API_BASE = getApiBase();

// -- Type d'erreur normalise --
// Toutes les erreurs API passent par ce type pour une gestion coherente
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}


// -- Fonction generique pour tous les appels API --
// Elle ajoute automatiquement les bons en-tetes et envoie le cookie
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...options.headers,
  };

  let res: Response;

  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      // -- CLE DE LA SECURITE --
      // Envoie le cookie httpOnly automatiquement a chaque requete
      // Le frontend n'a JAMAIS besoin de manipuler le jeton lui-meme
      credentials: "include",
    });
  } catch (err) {
    // Reseau coupe, DNS foire, etc.
    throw new ApiError(
      "Impossible de contacter le serveur. Verifie ta connexion internet.",
      0,
      "NETWORK_ERROR"
    );
  }

  // -- 401 Unauthorized : le cookie a expire ou est absent --
  // On redirige vers la page de connexion
  if (res.status === 401) {
    // Uniquement si on est cote navigateur (pas cote serveur pendant SSR)
    if (typeof window !== "undefined") {
      // On evite les boucles infinies si on est deja sur /login
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?session=expired";
      }
    }
    throw new ApiError("Session expiree. Reconnectez-vous.", 401, "UNAUTHORIZED");
  }

  // -- Autres erreurs (400, 403, 404, 500...) --
  if (!res.ok) {
    let errBody: { message?: string; code?: string } = {};
    try {
      errBody = await res.json();
    } catch {
      // Reponse non-JSON, on ignore
    }
    throw new ApiError(
      errBody.message ?? `Erreur ${res.status}`,
      res.status,
      errBody.code
    );
  }

  // -- 204 No Content : reponse vide legale --
  if (res.status === 204) return undefined as T;

  return res.json();
}


// ================================================================
// AUTHENTIFICATION
// Le backend gere le cookie httpOnly. Le frontend appelle juste
// les endpoints et laisse le navigateur gerer le cookie.
// ================================================================

export interface UserInfo {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
}

export interface LoginResponse {
  user: UserInfo;
  // Le backend renvoie le user, mais PAS le jeton
  // (le jeton est dans le cookie httpOnly, invisible pour nous)
}

// -- Connexion --
// Le backend valide les identifiants, cree une session,
// et pose le cookie httpOnly avec le JWT
export async function login(email: string, motDePasse: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, motDePasse }),
  });
}

// -- Deconnexion --
// Le backend supprime la session et efface le cookie
export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/auth/logout", { method: "POST" });
  } catch {
    // On ignore les erreurs : dans tous les cas on veut deconnecter cote client
  }
}

// -- Recupere l'utilisateur actuellement connecte --
// Utile pour verifier qu'on est bien authentifie au chargement de l'app
export async function getCurrentUser(): Promise<UserInfo | null> {
  try {
    return await apiFetch<UserInfo>("/auth/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}


// ================================================================
// COLIS
// ================================================================

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

// -- Cree un nouveau colis (commercant connecte) --
export function creerColis(data: CreateColisData): Promise<Colis> {
  return apiFetch("/colis", { method: "POST", body: JSON.stringify(data) });
}

// -- Recupere la liste des colis du commercant connecte --
export function getMesColis(): Promise<Colis[]> {
  return apiFetch("/colis/mes-colis");
}

// -- Recupere tous les colis (reserve aux admins/dispatchers) --
export function getAllColis(statut?: string): Promise<Colis[]> {
  const q = statut ? `?statut=${encodeURIComponent(statut)}` : "";
  return apiFetch(`/colis${q}`);
}

// -- Suivi public par numero de tracking (pas besoin d'etre connecte) --
export function suivreColis(tracking: string): Promise<Colis & { evenements: unknown[] }> {
  // On encode le tracking pour eviter les injections dans l'URL
  return apiFetch(`/colis/tracking/${encodeURIComponent(tracking)}`);
}

// -- Change le statut d'un colis (reserve aux agents et chauffeurs) --
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


// ================================================================
// COMMERCANT (profil, solde, transactions)
// ================================================================

export interface ProfilCommercant {
  id: number;
  nomBoutique: string;
  soldeCompte: number;
  ville?: string;
  user: { nom: string; prenom: string; email: string; telephone: string };
}

// -- Profil et solde du commercant connecte --
export function getMonProfil(): Promise<ProfilCommercant> {
  return apiFetch("/commercants/profil");
}

// -- Recharge le compte prepaye --
export function rechargerSolde(montant: number, methode: string) {
  return apiFetch("/commercants/recharger", {
    method: "POST",
    body: JSON.stringify({ montant, methode }),
  });
}

// -- Historique des transactions du commercant --
export function getMesTransactions() {
  return apiFetch("/commercants/transactions");
}


// ================================================================
// POINTS RELAIS
// ================================================================

export interface PointRelais {
  id: number;
  nom: string;
  type: string;
  ville: string;
  adresse: string;
  telephone: string;
}

// -- Liste tous les points relais actifs --
export function getPointsRelais(): Promise<PointRelais[]> {
  return apiFetch("/points-relais");
}


// ================================================================
// TARIFS
// ================================================================

// -- Calcule le prix pour un trajet + poids donne --
export function calculerPrix(
  origine: string,
  destination: string,
  poids: number
): Promise<{ prix: number; source: string }> {
  return apiFetch(
    `/tarifs/calculer?origine=${encodeURIComponent(origine)}&destination=${encodeURIComponent(destination)}&poids=${encodeURIComponent(poids)}`
  );
}
