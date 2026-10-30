// ============================================================
// Panneau de traitement d'un colis
//
// Les actions proposees viennent de `transitionsPossibles`, calcule par
// le serveur pour le role de la personne connectee. Rien n'est redeclare
// ici : la machine a etats du backend est la seule autorite, et une
// liste locale finirait par proposer des boutons qui echouent.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Package, Phone, User, Clock, AlertCircle, Loader2, Check } from "lucide-react";
import { ApiError, type EvenementColis } from "@/lib/api";
import { statutConfig, LABELS_SERVICE, LABELS_PAIEMENT, type StatutColis } from "@/lib/statuts";
import { useColisDetail, useChangerStatutColis, useUtilisateur } from "@/lib/queries";
import { formatMontant, formatPoids } from "@/lib/utils";
import { StatutBadge } from "@/components/StatutBadge";
import { C } from "@/lib/tokens";

/** Verbe de l'action, plus parlant qu'un nom de statut sur un bouton. */
const VERBES: Partial<Record<StatutColis, string>> = {
  PRIS_EN_CHARGE: "Prendre en charge",
  EN_TRANSIT: "Mettre en transit",
  ARRIVE_HUB: "Declarer arrive au hub",
  EN_ATTENTE_RETRAIT: "Mettre en attente de retrait",
  EN_LIVRAISON: "Partir en livraison",
  LIVRE: "Confirmer la remise",
  RETOURNE: "Declarer retourne",
  PERDU: "Declarer perdu",
  INCIDENT: "Signaler un incident",
  ANNULE: "Annuler le colis",
};

/** Actions lourdes : on demande une confirmation explicite du geste. */
const GRAVES: StatutColis[] = ["PERDU", "ANNULE", "RETOURNE", "INCIDENT"];

function heure(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function Ligne({ icone: Icone, label, valeur }: {
  icone: typeof MapPin; label: string; valeur: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icone size={15} strokeWidth={1.8} style={{ color: C.taupeLight, marginTop: "2px", flexShrink: 0 }} />
      <div className="min-w-0">
        <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: C.taupeLight }}>
          {label}
        </div>
        <div style={{ fontSize: "13.5px", color: C.anthracite, marginTop: "1px", wordBreak: "break-word" }}>
          {valeur}
        </div>
      </div>
    </div>
  );
}

function Journal({ evenements }: { evenements: EvenementColis[] }) {
  if (evenements.length === 0) {
    return <p style={{ fontSize: "13px", color: C.taupe }}>Aucun evenement enregistre.</p>;
  }

  return (
    <ol className="space-y-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {[...evenements].reverse().map((e, i) => {
        const config = statutConfig(e.statut);
        return (
          <li key={`${e.createdAt}-${i}`} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0" style={{ width: "10px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: config.color, marginTop: "5px" }} />
              {i < evenements.length - 1 && (
                <span style={{ flex: 1, width: "1px", backgroundColor: C.border, marginTop: "4px" }} />
              )}
            </div>
            <div className="min-w-0 pb-1">
              <div style={{ fontSize: "13px", fontWeight: 600, color: C.anthracite }}>{config.label}</div>
              <div style={{ fontSize: "11.5px", color: C.taupe, marginTop: "2px" }}>
                {heure(e.createdAt)}
                {e.localisation ? ` · ${e.localisation}` : ""}
              </div>
              {e.note && (
                <div style={{ fontSize: "12.5px", color: C.taupe, marginTop: "3px", fontStyle: "italic" }}>
                  {e.note}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Actions({ colisId, transitions }: {
  colisId: number;
  transitions: StatutColis[];
}) {
  const { data: user } = useUtilisateur();
  const mutation = useChangerStatutColis();
  const [cible, setCible] = useState<StatutColis | null>(null);
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");

  // Changer de colis sans vider ces champs enverrait la note ou le code
  // saisis pour le colis precedent.
  useEffect(() => {
    setCible(null);
    setNote("");
    setCode("");
    mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colisId]);

  if (transitions.length === 0) {
    return (
      <p style={{ fontSize: "13px", color: C.taupe, lineHeight: 1.6 }}>
        Aucune action possible sur ce colis depuis ton poste.
      </p>
    );
  }

  const codeRequis = cible === "LIVRE";
  const codeValide = /^\d{6}$/.test(code);
  const grave = cible !== null && GRAVES.includes(cible);
  const peutValider = cible !== null && (!codeRequis || codeValide) && !mutation.isPending;

  const valider = () => {
    if (!cible) return;
    mutation.mutate(
      {
        id: colisId,
        donnees: {
          statut: cible,
          ...(note.trim() ? { note: note.trim() } : {}),
          ...(codeRequis ? { codeRetrait: code } : {}),
          // Le journal de suivi doit dire OU l'evenement a eu lieu. Pour
          // un agent, c'est son agence ; pour les autres roles, le
          // serveur laisse la localisation vide.
          ...(user?.pointRelaisId ? { localisationId: user.pointRelaisId } : {}),
        },
      },
      {
        onSuccess: () => {
          setCible(null);
          setNote("");
          setCode("");
        },
      },
    );
  };

  const erreur = mutation.error instanceof ApiError
    ? mutation.error.messages.join(" ")
    : mutation.error
      ? "La connexion a echoue. Verifie le reseau et reessaie."
      : null;

  return (
    <div>
      {mutation.isSuccess && !cible && (
        <div
          role="status"
          className="flex items-center gap-2 mb-3 rounded-lg"
          style={{ backgroundColor: C.emeraldSoft, padding: "10px 12px" }}
        >
          <Check size={15} style={{ color: C.emerald, flexShrink: 0 }} />
          <span style={{ fontSize: "12.5px", color: C.emerald }}>
            Statut enregistre.
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {transitions.map((statut) => {
          const choisi = cible === statut;
          const danger = GRAVES.includes(statut);
          return (
            <button
              key={statut}
              onClick={() => { setCible(choisi ? null : statut); mutation.reset(); }}
              aria-pressed={choisi}
              className="rounded-lg"
              style={{
                padding: "9px 14px",
                minHeight: "40px",
                border: `1px solid ${choisi ? (danger ? C.terra : C.emerald) : C.border}`,
                backgroundColor: choisi ? (danger ? C.terra : C.emerald) : C.white,
                color: choisi ? C.white : (danger ? C.terra : C.emerald),
                fontFamily: "var(--font-body)",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {VERBES[statut] ?? statutConfig(statut).label}
            </button>
          );
        })}
      </div>

      {cible && (
        <div className="mt-4 rounded-xl" style={{ backgroundColor: C.ivory, border: `1px solid ${C.border}`, padding: "16px" }}>
          {codeRequis && (
            <div className="mb-4">
              <label htmlFor="code-retrait" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.anthracite, marginBottom: "6px" }}>
                Code de retrait
              </label>
              <input
                id="code-retrait"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="off"
                placeholder="6 chiffres"
                className="w-full rounded-lg"
                style={{
                  padding: "11px 14px",
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.white,
                  fontFamily: "var(--font-mono)",
                  fontSize: "17px",
                  letterSpacing: "5px",
                  color: C.anthracite,
                }}
              />
              <p style={{ fontSize: "11.5px", color: C.taupe, marginTop: "6px", lineHeight: 1.5 }}>
                Demande ce code au destinataire. Il prouve que le colis est
                bien remis a la bonne personne.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="note-statut" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.anthracite, marginBottom: "6px" }}>
              Note {grave ? "" : "(facultative)"}
            </label>
            <textarea
              id="note-statut"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 300))}
              rows={2}
              placeholder={grave ? "Explique ce qui s'est passe" : "Precision pour le suivi"}
              className="w-full rounded-lg"
              style={{
                padding: "10px 12px",
                border: `1px solid ${C.border}`,
                backgroundColor: C.white,
                fontSize: "13px",
                color: C.anthracite,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {erreur && (
            <div
              role="alert"
              className="flex items-start gap-2 mt-3 rounded-lg"
              style={{ backgroundColor: C.terraSoft, padding: "10px 12px" }}
            >
              <AlertCircle size={15} style={{ color: C.terra, marginTop: "1px", flexShrink: 0 }} />
              <span style={{ fontSize: "12.5px", color: C.error, lineHeight: 1.5 }}>{erreur}</span>
            </div>
          )}

          <button
            onClick={valider}
            disabled={!peutValider}
            className="w-full rounded-lg mt-4 flex items-center justify-center gap-2"
            style={{
              padding: "12px",
              minHeight: "46px",
              border: "none",
              backgroundColor: peutValider ? (grave ? C.terra : C.emerald) : C.sageDark,
              color: peutValider ? C.white : C.taupeLight,
              fontFamily: "var(--font-body)",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: peutValider ? "pointer" : "not-allowed",
            }}
          >
            {mutation.isPending && <Loader2 size={15} className="animate-spin" />}
            {mutation.isPending ? "Enregistrement" : `${VERBES[cible] ?? statutConfig(cible).label}`}
          </button>
        </div>
      )}
    </div>
  );
}

export function ColisPanel({ colisId, fermer }: { colisId: number | null; fermer: () => void }) {
  const { data: colis, isLoading, error } = useColisDetail(colisId);

  // La touche Echap doit fermer le panneau : c'est le geste attendu, et
  // sur mobile il recouvre tout l'ecran.
  useEffect(() => {
    if (colisId === null) return;
    const surTouche = (e: KeyboardEvent) => { if (e.key === "Escape") fermer(); };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [colisId, fermer]);

  if (colisId === null) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={fermer}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Detail du colis"
        className="fixed top-0 right-0 z-50 flex flex-col"
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "100dvh",
          backgroundColor: C.white,
          borderLeft: `1px solid ${C.border}`,
          boxShadow: "-12px 0 32px rgba(11, 77, 63, 0.10)",
        }}
      >
        <div
          className="flex items-start justify-between gap-3 shrink-0"
          style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}
        >
          <div className="min-w-0">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 600, color: C.anthracite, letterSpacing: "0.5px" }}>
              {colis?.tracking ?? "Chargement"}
            </div>
            {colis && <div className="mt-2"><StatutBadge statut={colis.statut} /></div>}
          </div>
          <button
            onClick={fermer}
            aria-label="Fermer le panneau"
            className="rounded-lg shrink-0"
            style={{ color: C.taupe, background: "none", border: "none", cursor: "pointer", minWidth: "44px", minHeight: "44px" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: "20px" }}>
          {isLoading && (
            <div className="flex items-center gap-2" style={{ color: C.taupe, fontSize: "13px" }}>
              <Loader2 size={15} className="animate-spin" />
              Chargement du colis
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg" style={{ backgroundColor: C.terraSoft, padding: "12px" }}>
              <AlertCircle size={15} style={{ color: C.terra, marginTop: "1px", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: C.error, lineHeight: 1.5 }}>
                {error instanceof ApiError && error.status === 404
                  ? "Ce colis ne releve pas de ton poste, ou il n'existe plus."
                  : "Le detail du colis n'a pas pu etre charge."}
              </span>
            </div>
          )}

          {colis && (
            <div className="space-y-6">
              <section className="space-y-3">
                <Ligne icone={User} label="Destinataire" valeur={colis.destinataireNom} />
                <Ligne icone={Phone} label="Telephone" valeur={colis.destinataireTel} />
                <Ligne
                  icone={MapPin}
                  label="Trajet"
                  valeur={`${colis.origine.nom} (${colis.origine.ville}) vers ${colis.destination.nom} (${colis.destination.ville})`}
                />
                {colis.destinataireAdresse && (
                  <Ligne icone={MapPin} label="Adresse de livraison" valeur={colis.destinataireAdresse} />
                )}
                <Ligne
                  icone={Package}
                  label="Contenu"
                  valeur={`${formatPoids(colis.poidsGrammes)}${colis.description ? ` · ${colis.description}` : ""}`}
                />
                <Ligne icone={Clock} label="Cree le" valeur={heure(colis.createdAt)} />
              </section>

              <section
                className="rounded-xl"
                style={{ backgroundColor: C.ivory, border: `1px solid ${C.border}`, padding: "14px" }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span style={{ fontSize: "12px", color: C.taupe }}>Montant</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 600, color: C.anthracite }}>
                    {formatMontant(colis.montant)} XOF
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 mt-2">
                  <span style={{ fontSize: "12px", color: C.taupe }}>Paiement</span>
                  <span style={{ fontSize: "12.5px", color: C.anthracite, textAlign: "right" }}>
                    {LABELS_PAIEMENT[colis.modePaiement] ?? colis.modePaiement}
                    {colis.paiementConfirme ? " · encaisse" : " · a encaisser"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 mt-2">
                  <span style={{ fontSize: "12px", color: C.taupe }}>Service</span>
                  <span style={{ fontSize: "12.5px", color: C.anthracite }}>
                    {LABELS_SERVICE[colis.service] ?? colis.service}
                  </span>
                </div>
              </section>

              <section>
                <h3 style={{ fontFamily: "var(--font-body)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: C.taupeLight, marginBottom: "12px" }}>
                  Traitement
                </h3>
                <Actions colisId={colis.id} transitions={colis.transitionsPossibles} />
              </section>

              <section>
                <h3 style={{ fontFamily: "var(--font-body)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: C.taupeLight, marginBottom: "12px" }}>
                  Journal de suivi
                </h3>
                <Journal evenements={colis.evenements} />
              </section>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
