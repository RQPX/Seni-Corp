// ============================================================
// Briques d'interface partagees
//
// Ces composants n'ont aucune logique metier : ils portent seulement
// les styles repetes par les ecrans d'exploitation.
// ============================================================

"use client";

import type { ReactNode, CSSProperties } from "react";
import { AlertCircle, Loader2, Inbox, Lock } from "lucide-react";
import { ApiError } from "@/lib/api";
import type { Role } from "@/lib/statuts";
import { useUtilisateur } from "@/lib/queries";
import { C } from "@/lib/tokens";

export function EnTetePage({ titre, soustitre, action }: {
  titre: string;
  soustitre?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700, color: C.anthracite }}>
          {titre}
        </h2>
        {soustitre && (
          <p style={{ fontSize: "13px", color: C.taupe, marginTop: "4px" }}>{soustitre}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Carte({ children, onClick, style }: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    backgroundColor: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "14px 16px",
    ...style,
  };

  if (!onClick) return <div style={base}>{children}</div>;

  return (
    <button onClick={onClick} className="w-full text-left" style={{ ...base, cursor: "pointer", display: "block" }}>
      {children}
    </button>
  );
}

export function Bouton({ children, onClick, variante = "principal", disabled, type = "button", pleineLargeur }: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "principal" | "secondaire" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  pleineLargeur?: boolean;
}) {
  const fonds = { principal: C.emerald, secondaire: C.white, danger: C.terra };
  const textes = { principal: C.white, secondaire: C.emerald, danger: C.white };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg inline-flex items-center justify-center gap-2"
      style={{
        padding: "10px 18px",
        minHeight: "44px",
        width: pleineLargeur ? "100%" : undefined,
        border: variante === "secondaire" ? `1px solid ${C.border}` : "none",
        backgroundColor: disabled ? C.sageDark : fonds[variante],
        color: disabled ? C.taupeLight : textes[variante],
        fontFamily: "var(--font-heading)",
        fontSize: "13px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

/**
 * Libelle et champ de saisie.
 *
 * Le controle est IMBRIQUE dans le <label>, ce qui les associe sans avoir
 * a inventer un identifiant unique pour chacun. Un label pose a cote,
 * sans htmlFor, n'est relie a rien : un lecteur d'ecran annonce alors un
 * champ sans nom, et cliquer sur le texte ne place pas le curseur.
 */
export function Champ({ label, children, aide }: { label: string; children: ReactNode; aide?: string }) {
  return (
    <div>
      <label>
        <span style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.anthracite, marginBottom: "6px" }}>
          {label}
        </span>
        {children}
      </label>
      {aide && (
        <p style={{ fontSize: "11.5px", color: C.taupe, marginTop: "5px", lineHeight: 1.5 }}>{aide}</p>
      )}
    </div>
  );
}

/** Style commun des champs de saisie et des listes deroulantes. */
export const styleSaisie: CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  border: `1px solid ${C.border}`,
  borderRadius: "8px",
  backgroundColor: C.white,
  fontSize: "13.5px",
  color: C.anthracite,
  minHeight: "44px",
  fontFamily: "inherit",
};

/**
 * Message d'erreur.
 *
 * Le backend explique lui-meme pourquoi il refuse (capacite depassee,
 * permis expire, camion deja engage). On affiche donc SON message, qui
 * est utile, plutot qu'un texte generique qui ne dit rien.
 */
export function Erreur({ erreur, repli }: { erreur: unknown; repli?: string }) {
  if (!erreur) return null;
  const texte = erreur instanceof ApiError
    ? erreur.messages.join(" ")
    : repli ?? "La connexion a echoue. Verifie le reseau et reessaie.";

  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg" style={{ backgroundColor: C.terraSoft, padding: "11px 13px" }}>
      <AlertCircle size={15} style={{ color: C.terra, marginTop: "1px", flexShrink: 0 }} />
      <span style={{ fontSize: "12.5px", color: C.error, lineHeight: 1.55 }}>{texte}</span>
    </div>
  );
}

export function Chargement({ texte = "Chargement" }: { texte?: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: C.taupe, fontSize: "13px", padding: "28px 0" }}>
      <Loader2 size={15} className="animate-spin" />
      {texte}
    </div>
  );
}

export function Vide({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="flex flex-col items-center text-center rounded-xl" style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "40px 24px" }}>
      <Inbox size={26} strokeWidth={1.5} style={{ color: C.taupeLight }} />
      <p style={{ fontSize: "14px", color: C.anthracite, marginTop: "12px", fontWeight: 600 }}>{titre}</p>
      <p style={{ fontSize: "12.5px", color: C.taupe, marginTop: "6px", lineHeight: 1.6, maxWidth: "340px" }}>{texte}</p>
    </div>
  );
}

/** Pastille generique, pour les statuts hors colis. */
export function Pastille({ texte, fond, couleur }: { texte: string; fond: string; couleur: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full whitespace-nowrap"
      style={{ backgroundColor: fond, color: couleur, fontFamily: "var(--font-heading)", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.3px", padding: "3px 9px" }}
    >
      {texte}
    </span>
  );
}

/**
 * Garde d'interface.
 *
 * Elle ne remplace PAS le controle d'acces : le backend refuse de toute
 * facon ce qui n'est pas permis, et c'est lui qui decide. Elle evite
 * seulement de lancer une requete dont on sait qu'elle sera refusee, et
 * d'afficher un message d'erreur technique a quelqu'un qui a simplement
 * ouvert une adresse qui ne le concerne pas.
 *
 * Les enfants ne sont pas rendus tant que le role n'est pas connu, pour
 * que leurs requetes ne partent pas avant la verification.
 */
export function ReserveAu({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { data: user, isLoading } = useUtilisateur();

  if (isLoading) return <Chargement />;

  if (user && !roles.includes(user.role)) {
    return (
      <div style={{ padding: "20px 16px 48px", maxWidth: "620px" }} className="md:px-8">
        <div className="flex items-start gap-3 rounded-xl" style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "24px" }}>
          <Lock size={20} strokeWidth={1.6} style={{ color: C.taupeLight, marginTop: "2px", flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 600, color: C.anthracite }}>
              Cet ecran ne releve pas de ton poste
            </p>
            <p style={{ fontSize: "13px", color: C.taupe, marginTop: "6px", lineHeight: 1.6 }}>
              Il est reserve au dispatch et a l&apos;administration. Reviens aux
              colis ou aux tournees depuis le menu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
