// ================================================================
// SENI CORP — Client API
// Toutes les fonctions qui parlent au backend passent par ici.
//
// SECURITE — trois invariants a ne jamais casser :
//  1. Aucun jeton n'est stocke cote client. L'authentification tient
//     entierement dans des cookies httpOnly poses par le backend.
//  2. Toute ecriture (POST/PATCH/PUT/DELETE) porte l'en-tete
//     X-CSRF-Token, recopie depuis le cookie seni_csrf (lisible par JS
//     volontairement : un site tiers peut declencher une requete mais ne
//     peut pas lire notre cookie, donc pas remplir l'en-tete).
//  3. Aucun montant ni numero de suivi n'est calcule ici. Ils viennent
//     du serveur, on ne fait que les afficher.
// ================================================================

import type {
  ModePaiement,
  Role,
  StatutColis,
  StatutTransaction,
  TypeClient,
  TypeService,
  TypeTransaction,
} from "@/lib/statuts";

// -- Base de l'API --
// L'API est proxifiee par Next (voir rewrites() dans next.config.ts),
// donc un chemin relatif est la valeur normale, y compris en production.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";


// ================================================================
// ERREURS
// ================================================================

export type CodeErreur =
  | "VALIDATION"
  | "DOUBLON"
  | "INTROUVABLE"
  | "CONTRAINTE_METIER"
  | "ERREUR_INTERNE"
  | "RESEAU"
  | "NON_AUTHENTIFIE";

export class ApiError extends Error {
  status: number;
  code?: string;
  /** Le backend renvoie `message` en chaine ou en tableau : ici toujours un tableau. */
  messages: string[];

  constructor(messages: string[], status: number, code?: string) {
    super(messages.join(" ") || `Erreur ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.messages = messages;
  }
}


// ================================================================
// CSRF
// ================================================================

export function lireJetonCsrf(): string | null {
  if (typeof document === "undefined") return null;
  const trouve = document.cookie
    .split("; ")
    .find((c) => c.startsWith("seni_csrf="));
  return trouve ? decodeURIComponent(trouve.split("=")[1]) : null;
}


// ================================================================
// RAFRAICHISSEMENT DE SESSION
// ================================================================

// Le jeton d'acces expire au bout de 15 minutes. Quand plusieurs requetes
// partent en parallele et prennent toutes un 401, elles doivent partager UN
// SEUL appel a /auth/refresh : le backend fait tourner les jetons de
// rafraichissement et interprete un second usage du meme jeton comme un vol,
// ce qui revoque toute la session. Cette promesse mutualisee est donc une
// protection, pas une optimisation.
let refreshEnCours: Promise<boolean> | null = null;

function rafraichirSession(): Promise<boolean> {
  if (!refreshEnCours) {
    const headers: Record<string, string> = { Accept: "application/json" };
    const csrf = lireJetonCsrf();
    if (csrf) headers["X-CSRF-Token"] = csrf;

    refreshEnCours = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers,
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshEnCours = null;
      });
  }
  return refreshEnCours;
}

function redirigerVersLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  window.location.href = "/login?session=expired";
}

// Routes ou un 401 est une reponse metier normale, pas une session expiree :
// tenter un rafraichissement dessus ne ferait que boucler.
const ROUTES_SANS_REFRESH = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];


// ================================================================
// APPEL GENERIQUE
// ================================================================

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  dejaRafraichi = false
): Promise<T> {
  const methode = (options.method ?? "GET").toUpperCase();
  const estEcriture = methode !== "GET" && methode !== "HEAD";

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (estEcriture) {
    const csrf = lireJetonCsrf();
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      ["Impossible de contacter le serveur. Verifie ta connexion internet."],
      0,
      "RESEAU"
    );
  }

  // -- 401 : jeton d'acces expire, on tente un rafraichissement unique --
  if (res.status === 401 && !dejaRafraichi && !ROUTES_SANS_REFRESH.includes(path)) {
    const rafraichi = await rafraichirSession();
    if (rafraichi) return apiFetch<T>(path, options, true);

    redirigerVersLogin();
    throw new ApiError(["Session expiree. Reconnectez-vous."], 401, "NON_AUTHENTIFIE");
  }

  if (!res.ok) {
    let corps: { message?: string | string[]; code?: string } = {};
    try {
      corps = await res.json();
    } catch {
      // Reponse non-JSON (502 d'un proxy, page d'erreur HTML...)
    }
    const messages = Array.isArray(corps.message)
      ? corps.message
      : corps.message
        ? [corps.message]
        : [`Erreur ${res.status}`];
    throw new ApiError(messages, res.status, corps.code);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Construit une query string en ignorant les valeurs vides
function query(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(params)) {
    if (valeur === undefined || valeur === null || valeur === "") continue;
    qs.set(cle, String(valeur));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}


// ================================================================
// TYPES PARTAGES
// ================================================================

export interface Paginated<T> {
  elements: T[];
  total: number;
  page: number;
  parPage: number;
  pages: number;
}

export interface UserInfo {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  role: Role;
  clientId: number | null;
}

export interface AuthResponse {
  user: UserInfo;
  csrfToken: string;
}


// ================================================================
// AUTHENTIFICATION
// ================================================================

export interface RegisterData {
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  telephone: string;
  typeClient: TypeClient;
  /** Obligatoire si typeClient vaut ENTREPRISE, interdit sinon. */
  nomBoutique?: string;
  ville?: string;
}

export function register(data: RegisterData): Promise<AuthResponse> {
  return apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) });
}

export function login(email: string, motDePasse: string): Promise<AuthResponse> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, motDePasse }),
  });
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/auth/logout", { method: "POST" });
  } catch {
    // On deconnecte cote client dans tous les cas
  }
}

export function logoutAll(): Promise<{ success: boolean; sessionsRevoquees: number }> {
  return apiFetch("/auth/logout-all", { method: "POST" });
}

export async function getCurrentUser(): Promise<UserInfo | null> {
  try {
    return await apiFetch<UserInfo>("/auth/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export function getCsrfToken(): Promise<{ csrfToken: string }> {
  return apiFetch("/auth/csrf");
}


// ================================================================
// COLIS
// ================================================================

export interface PointRelaisResume {
  id: number;
  nom: string;
  ville: string;
}

export interface Colis {
  id: number;
  tracking: string;
  destinataireNom: string;
  destinataireTel: string;
  destinataireAdresse: string | null;
  /** En GRAMMES en sortie, alors que l'API accepte des KG en entree. */
  poidsGrammes: number;
  description: string | null;
  service: TypeService;
  /** Entier XOF. Aucun montant n'est calcule cote client. */
  montant: number;
  montantTransport: number;
  montantSupplement: number;
  statut: StatutColis;
  modePaiement: ModePaiement;
  paiementConfirme: boolean;
  createdAt: string;
  updatedAt: string;
  clientId: number;
  origine: PointRelaisResume;
  destination: PointRelaisResume;
}

/** La reponse de creation porte le code de retrait : 6 chiffres, renvoyes UNE SEULE FOIS. */
export interface ColisCree extends Colis {
  codeRetrait: string;
}

/** Le detail porte les transitions autorisees pour le role de l'appelant. */
export interface ColisDetail extends Colis {
  transitionsPossibles: StatutColis[];
}

export interface CreateColisData {
  origineId: number;
  destinationId: number;
  destinataireNom: string;
  destinataireTel: string;
  /** Obligatoire si service vaut DOMICILE. */
  destinataireAdresse?: string;
  /** En KG, decimales acceptees. */
  poids: number;
  description?: string;
  service: TypeService;
  modePaiement: ModePaiement;
}

export function creerColis(data: CreateColisData): Promise<ColisCree> {
  return apiFetch("/colis", { method: "POST", body: JSON.stringify(data) });
}

export interface ListeColisParams {
  statut?: StatutColis | "";
  clientId?: number;
  recherche?: string;
  page?: number;
  parPage?: number;
}

/**
 * S'adapte au role : un CLIENT ne recoit que ses colis, le personnel voit tout.
 * `clientId` est ignore par le serveur si l'appelant est un client.
 */
export function getColis(params: ListeColisParams = {}): Promise<Paginated<Colis>> {
  return apiFetch(`/colis${query({ ...params })}`);
}

export function getColisDetail(id: number): Promise<ColisDetail> {
  return apiFetch(`/colis/${id}`);
}

export interface ChangerStatutData {
  statut: StatutColis;
  note?: string;
  localisationId?: number;
  /** Obligatoire pour passer a LIVRE. */
  codeRetrait?: string;
}

export function changerStatutColis(id: number, data: ChangerStatutData): Promise<Colis> {
  return apiFetch(`/colis/${id}/statut`, { method: "PATCH", body: JSON.stringify(data) });
}

/** Suivi public : reponse volontairement reduite (pas de telephone, montant ni adresse). */
export interface SuiviPublic {
  tracking: string;
  statut: StatutColis;
  /** Masque cote serveur, ex. "Fatou D." */
  destinataireNom: string;
  service: TypeService;
  origine: PointRelaisResume;
  destination: PointRelaisResume;
  createdAt: string;
  updatedAt: string;
  evenements?: { statut: StatutColis; date: string; note?: string | null }[];
}

export function suivreColis(code: string): Promise<SuiviPublic> {
  return apiFetch(`/colis/tracking/${encodeURIComponent(code)}`);
}


// ================================================================
// CLIENTS (profil, solde, transactions)
// ================================================================

export interface ProfilClient {
  id: number;
  typeClient: TypeClient;
  nomBoutique: string | null;
  ville: string | null;
  /** Entier XOF. Lecture seule : PATCH /clients/profil refuse ce champ. */
  soldeCompte: number;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    role: Role;
  };
}

export function getProfil(): Promise<ProfilClient> {
  return apiFetch("/clients/profil");
}

export interface MajProfilData {
  nom?: string;
  prenom?: string;
  telephone?: string;
  nomBoutique?: string;
  ville?: string;
}

/** N'accepte ni soldeCompte, ni typeClient, ni role : le serveur renvoie 400. */
export function majProfil(data: MajProfilData): Promise<ProfilClient> {
  return apiFetch("/clients/profil", { method: "PATCH", body: JSON.stringify(data) });
}

export interface Transaction {
  id: number;
  reference: string;
  type: TypeTransaction;
  montant: number;
  statut: StatutTransaction;
  description: string | null;
  createdAt: string;
}

export function getTransactions(page = 1, parPage = 20): Promise<Paginated<Transaction>> {
  return apiFetch(`/clients/transactions${query({ page, parPage })}`);
}

/** Reponse de /clients/recharger : plus etroite qu'une transaction complete. */
export interface DemandeRecharge {
  id: number;
  reference: string;
  montant: number;
  statut: StatutTransaction;
  createdAt: string;
}

/**
 * Ne credite RIEN : cree une transaction ATTENTE et renvoie sa reference.
 * Le solde n'augmente qu'apres confirmation par CinetPay.
 */
export function rechargerCompte(montant: number): Promise<DemandeRecharge> {
  return apiFetch("/clients/recharger", {
    method: "POST",
    body: JSON.stringify({ montant, methode: "CINETPAY" }),
  });
}

/** Renvoie 503 tant que les cles CinetPay ne sont pas configurees. */
export function creerLienPaiement(reference: string): Promise<{ urlPaiement: string }> {
  return apiFetch(`/paiements/${encodeURIComponent(reference)}/lien`, { method: "POST" });
}


// ================================================================
// POINTS RELAIS ET TARIFS (publics)
// ================================================================

export interface PointRelais {
  id: number;
  nom: string;
  type: string;
  ville: string;
  adresse: string;
  telephone: string;
}

export function getPointsRelais(ville?: string): Promise<PointRelais[]> {
  return apiFetch(`/points-relais${query({ ville })}`);
}

export function getVilles(): Promise<string[]> {
  return apiFetch("/points-relais/villes");
}

export interface CalculTarif {
  montantTransport: number;
  montantSupplement: number;
  montant: number;
  source: "grille";
  origine: string;
  destination: string;
  poidsKg: number;
  service: TypeService;
}

/**
 * `service` fait partie du calcul : sans lui, le supplement domicile
 * n'est pas facture et l'affichage ment sur le prix.
 * Renvoie 404 si le trajet n'est pas dans la grille.
 */
export function calculerPrix(
  origine: string,
  destination: string,
  poids: number,
  service: TypeService
): Promise<CalculTarif> {
  return apiFetch(`/tarifs/calculer${query({ origine, destination, poids, service })}`);
}

export function getGrilleTarifs(): Promise<unknown> {
  return apiFetch("/tarifs/grille");
}


// ================================================================
// UTILISATEURS
// ================================================================

/** Accessible a tous. Revoque toutes les autres sessions. */
export function changerMotDePasse(
  motDePasseActuel: string,
  nouveauMotDePasse: string
): Promise<{ success: boolean }> {
  return apiFetch("/users/moi/mot-de-passe", {
    method: "PATCH",
    body: JSON.stringify({ motDePasseActuel, nouveauMotDePasse }),
  });
}
