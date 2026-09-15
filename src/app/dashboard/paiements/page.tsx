// ============================================================
// SENI CORP — Page "Paiements"
// Solde du compte, demande de recharge, historique des transactions.
//
// Une recharge ne credite rien immediatement : elle cree une
// transaction ATTENTE. Le solde n'augmente qu'apres confirmation
// par CinetPay. L'interface doit donc parler d'attente de paiement,
// jamais de recharge effectuee.
// ============================================================

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight, ArrowDownRight, Wallet, CheckCircle2, Clock,
  X, CreditCard, AlertTriangle, ExternalLink
} from "lucide-react";
import { ApiError, creerLienPaiement, rechargerCompte, type DemandeRecharge } from "@/lib/api";
import { LABELS_STATUT_TRANSACTION, LABELS_TYPE_TRANSACTION } from "@/lib/statuts";
import { formatDateFr } from "@/lib/utils";
import { cles, useProfil, useTransactions } from "@/lib/queries";
import { C } from "@/lib/tokens";

const MONTANTS_RECHARGE = [10000, 25000, 50000, 100000];
const PAR_PAGE = 20;

// Les transactions qui augmentent le solde
const CREDITS = new Set(["RECHARGE", "REMBOURSEMENT"]);

export default function PaiementsPage() {
  const queryClient = useQueryClient();
  const { data: profil } = useProfil();

  const [page, setPage] = useState(1);
  const { data: transactions, isPending } = useTransactions(page, PAR_PAGE);

  const [selectedMontant, setSelectedMontant] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [enAttente, setEnAttente] = useState<DemandeRecharge | null>(null);
  const [erreurLien, setErreurLien] = useState("");

  // -- Etape 1 : creer la transaction en attente --
  const recharge = useMutation({
    mutationFn: (montant: number) => rechargerCompte(montant),
    onSuccess: (tx) => {
      setEnAttente(tx);
      setErreurLien("");
      // L'historique contient desormais une ligne ATTENTE
      queryClient.invalidateQueries({ queryKey: ["clients", "transactions"] });
    },
  });

  // -- Etape 2 : obtenir le lien de paiement et y envoyer l'utilisateur --
  const lien = useMutation({
    mutationFn: (reference: string) => creerLienPaiement(reference),
    onSuccess: ({ urlPaiement }) => {
      window.location.href = urlPaiement;
    },
    onError: (err) => {
      // 503 = les cles CinetPay ne sont pas encore configurees cote serveur
      if (err instanceof ApiError && err.status === 503) {
        setErreurLien(
          "Le paiement en ligne n'est pas encore actif. En attendant, tu peux payer " +
          "un envoi depuis ton solde existant ou choisir le paiement a la livraison."
        );
        return;
      }
      setErreurLien(err instanceof ApiError ? err.message : "Impossible d'ouvrir la page de paiement.");
    },
  });

  const openRecharge = () => {
    if (!selectedMontant) return;
    setEnAttente(null);
    setErreurLien("");
    recharge.reset();
    lien.reset();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEnAttente(null);
    setErreurLien("");
    recharge.reset();
    lien.reset();
  };

  const erreurRecharge = recharge.error instanceof ApiError ? recharge.error.message : "";

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 max-w-[1400px] mx-auto">
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700, color: C.anthracite, marginBottom: "24px" }}>Paiements</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">

        {/* Carte solde */}
        <div className="relative overflow-hidden rounded-2xl" style={{ backgroundColor: C.emerald, padding: "28px" }}>
          <div className="absolute" style={{ top: "-30px", right: "-30px", width: "120px", height: "120px", background: `radial-gradient(circle, ${C.bronze} 0%, transparent 70%)`, opacity: 0.35 }} />
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={18} style={{ color: C.bronzeLight }} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: C.bronzeLight }}>Solde disponible</span>
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "36px", fontWeight: 800, color: C.white, lineHeight: 1 }}>
            {profil ? profil.soldeCompte.toLocaleString("fr") : "—"}
            <span style={{ fontSize: "16px", fontWeight: 500, color: C.bronzeLight, marginLeft: "8px" }}>XOF</span>
          </div>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "8px" }}>
            Le solde est tenu par le serveur, jamais par le navigateur.
          </p>
        </div>

        {/* Bloc recharge */}
        <div className="lg:col-span-2 rounded-2xl" style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "24px" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: C.anthracite, marginBottom: "4px" }}>Recharger le compte</h2>
          <p style={{ fontSize: "12px", color: C.taupeLight, marginBottom: "16px" }}>
            Paiement securise via <strong style={{ color: C.anthracite }}>CinetPay</strong> — accepte Wave, Orange Money et carte bancaire.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {MONTANTS_RECHARGE.map((m) => (
              <button key={m} onClick={() => setSelectedMontant(m)} className="rounded-xl transition-colors"
                style={{
                  padding: "14px", textAlign: "center", cursor: "pointer",
                  border: selectedMontant === m ? `2px solid ${C.emerald}` : `1.5px solid ${C.border}`,
                  backgroundColor: selectedMontant === m ? C.emeraldSoft : C.ivory,
                }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.anthracite }}>{m.toLocaleString("fr")}</div>
                <div style={{ fontSize: "10px", color: C.taupe, marginTop: "2px" }}>XOF</div>
              </button>
            ))}
          </div>

          {!selectedMontant && <p style={{ fontSize: "12px", color: C.taupeLight, marginBottom: "12px" }}>Selectionnez un montant ci-dessus</p>}

          <button
            onClick={openRecharge}
            disabled={!selectedMontant}
            className="flex items-center gap-2 rounded-lg"
            style={{
              padding: "11px 22px",
              backgroundColor: selectedMontant ? C.emerald : C.sage,
              color: selectedMontant ? C.white : C.taupeLight,
              border: "none",
              fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600,
              cursor: selectedMontant ? "pointer" : "not-allowed",
              minHeight: "44px",
            }}>
            <CreditCard size={16} strokeWidth={2} />
            Recharger via CinetPay
          </button>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span style={{ fontSize: "10px", color: C.taupeLight }}>Methodes acceptees :</span>
            {["Wave", "Orange Money", "Carte bancaire"].map((m) => (
              <span key={m} style={{ fontSize: "10px", fontWeight: 600, color: C.taupe, backgroundColor: C.sage, padding: "2px 8px", borderRadius: "20px" }}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Historique des transactions */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: C.anthracite }}>Historique des transactions</h2>
        </div>
        <div>
          {isPending ? (
            <div className="px-5 py-12 text-center">
              <p style={{ fontSize: "13px", color: C.taupe }}>Chargement...</p>
            </div>
          ) : (transactions?.elements.length ?? 0) === 0 ? (
            <div className="px-5 py-12 text-center">
              <CreditCard size={32} style={{ color: C.border, margin: "0 auto 10px" }} />
              <p style={{ fontSize: "13px", color: C.taupe }}>Aucune transaction pour l&apos;instant.</p>
            </div>
          ) : transactions!.elements.map((tx) => {
            const isCredit = CREDITS.has(tx.type);
            const confirme = tx.statut === "CONFIRME";
            return (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-4 transition-colors"
                style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.ivory}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: "40px", height: "40px", backgroundColor: isCredit ? C.emeraldSoft : C.bronzeSoft, color: isCredit ? C.emerald : C.bronze }}>
                  {isCredit ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: "13px", fontWeight: 500, color: C.anthracite }}>
                    {tx.description ?? LABELS_TYPE_TRANSACTION[tx.type] ?? tx.type}
                  </div>
                  <div style={{ fontSize: "11px", color: C.taupeLight, marginTop: "2px" }}>{formatDateFr(tx.createdAt)}</div>
                </div>
                <div className="hidden sm:block shrink-0">
                  <span className="inline-flex items-center gap-1 rounded-full" style={{
                    padding: "3px 8px", fontSize: "10px", fontWeight: 600,
                    fontFamily: "var(--font-heading)",
                    backgroundColor: confirme ? C.emeraldSoft : C.bronzeSoft,
                    color: confirme ? C.success : C.bronze,
                  }}>
                    {confirme ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                    {LABELS_STATUT_TRANSACTION[tx.statut] ?? tx.statut}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 700, color: isCredit ? C.success : C.anthracite, whiteSpace: "nowrap" }}>
                  {isCredit ? "+" : "−"}{Math.abs(tx.montant).toLocaleString("fr")} <span style={{ fontSize: "10px", fontWeight: 400, color: C.taupe }}>XOF</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination cote serveur */}
        {(transactions?.pages ?? 1) > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: "12px", color: C.taupe }}>
              Page {transactions!.page} / {transactions!.pages} — {transactions!.total} transactions
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg"
                style={{
                  padding: "8px 14px", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-heading)",
                  backgroundColor: page === 1 ? C.sage : C.white, border: `1px solid ${C.border}`,
                  color: page === 1 ? C.taupeLight : C.taupe,
                  cursor: page === 1 ? "not-allowed" : "pointer", minHeight: "40px",
                }}
              >
                Precedent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(transactions!.pages, p + 1))}
                disabled={page >= transactions!.pages}
                className="rounded-lg"
                style={{
                  padding: "8px 14px", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-heading)",
                  backgroundColor: page >= transactions!.pages ? C.sage : C.emerald, border: "none",
                  color: page >= transactions!.pages ? C.taupeLight : C.white,
                  cursor: page >= transactions!.pages ? "not-allowed" : "pointer", minHeight: "40px",
                }}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modale de recharge */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8" style={{ backgroundColor: "rgba(0,0,0,0.55)", overflowY: "auto" }} role="dialog" aria-modal="true">
          <div className="rounded-2xl w-full" style={{ maxWidth: "440px", backgroundColor: C.white, overflow: "hidden" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: C.emerald }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 700, color: C.white }}>Recharge via CinetPay</div>
              <button onClick={closeModal} aria-label="Fermer" style={{ background: "none", border: "none", color: C.bronzeLight, cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-xl text-center mb-5" style={{ backgroundColor: C.emeraldSoft, padding: "16px" }}>
                <div style={{ fontSize: "10px", color: C.taupe, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "6px" }}>Montant a recharger</div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 800, color: C.emerald }}>
                  {selectedMontant?.toLocaleString("fr")} <span style={{ fontSize: "14px", color: C.taupe }}>XOF</span>
                </div>
              </div>

              {enAttente ? (
                <>
                  {/* La transaction existe mais reste ATTENTE : rien n'est credite */}
                  <div className="rounded-xl mb-4" style={{ backgroundColor: C.warningSoft, border: `1px solid ${C.warning}`, padding: "14px" }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: "6px" }}>
                      <Clock size={15} style={{ color: C.warning, flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 700, color: C.anthracite }}>
                        En attente de paiement
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: C.taupe, lineHeight: 1.6 }}>
                      Ton solde sera credite une fois le paiement confirme par CinetPay.
                    </p>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: C.taupe, marginTop: "8px" }}>
                      Reference : {enAttente.reference}
                    </p>
                  </div>

                  {erreurLien && (
                    <div className="flex items-start gap-2 rounded-lg mb-4" style={{ backgroundColor: C.terraSoft, border: `1px solid ${C.terra}`, padding: "10px 12px" }} role="alert">
                      <AlertTriangle size={15} style={{ color: C.terra, flexShrink: 0, marginTop: "1px" }} />
                      <span style={{ fontSize: "12px", color: C.terra, fontWeight: 500, lineHeight: 1.5 }}>{erreurLien}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={closeModal} className="flex-1 rounded-lg" style={{ padding: "11px", border: `1px solid ${C.border}`, backgroundColor: C.white, color: C.taupe, fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer", minHeight: "44px" }}>
                      Fermer
                    </button>
                    {!erreurLien && (
                      <button
                        onClick={() => lien.mutate(enAttente.reference)}
                        disabled={lien.isPending}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg"
                        style={{
                          padding: "11px", border: "none", backgroundColor: C.emerald, color: C.white,
                          fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600,
                          cursor: lien.isPending ? "wait" : "pointer", opacity: lien.isPending ? 0.7 : 1,
                          minHeight: "44px",
                        }}>
                        <ExternalLink size={15} />
                        {lien.isPending ? "Ouverture..." : "Payer maintenant"}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "16px", lineHeight: 1.6 }}>
                    Une demande de recharge va etre enregistree. Tu seras ensuite redirige vers
                    la page de paiement <strong style={{ color: C.anthracite }}>CinetPay</strong> pour
                    choisir ta methode (Wave, Orange Money ou carte bancaire).
                  </p>

                  {erreurRecharge && (
                    <div className="flex items-start gap-2 rounded-lg mb-4" style={{ backgroundColor: C.terraSoft, border: `1px solid ${C.terra}`, padding: "10px 12px" }} role="alert">
                      <AlertTriangle size={15} style={{ color: C.terra, flexShrink: 0, marginTop: "1px" }} />
                      <span style={{ fontSize: "12px", color: C.terra, fontWeight: 500, lineHeight: 1.5 }}>{erreurRecharge}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={closeModal} className="flex-1 rounded-lg" style={{ padding: "11px", border: `1px solid ${C.border}`, backgroundColor: C.white, color: C.taupe, fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer", minHeight: "44px" }}>
                      Annuler
                    </button>
                    <button
                      onClick={() => recharge.mutate(selectedMontant!)}
                      disabled={recharge.isPending}
                      className="flex-1 rounded-lg"
                      style={{
                        padding: "11px", border: "none", backgroundColor: C.emerald, color: C.white,
                        fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600,
                        cursor: recharge.isPending ? "wait" : "pointer", opacity: recharge.isPending ? 0.7 : 1,
                        minHeight: "44px",
                      }}>
                      {recharge.isPending ? "Traitement..." : "Continuer"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="h-8" />
    </div>
  );
}
