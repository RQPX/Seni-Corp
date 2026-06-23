// ============================================================
// SENI CORP — Page "Paiements"
// Solde du compte, recharge via CinetPay, historique.
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, CheckCircle2, Clock, X, CreditCard } from "lucide-react";
import { useAppStore } from "@/store/appStore";

const C = {
  emerald: "#0B4D3F", emeraldSoft: "#E8F0ED",
  bronze: "#B8935A", bronzeLight: "#D4B486", bronzeSoft: "#F5EFE3",
  ivory: "#FAF6F0", sage: "#E8EDE5", anthracite: "#1A1A1A",
  taupe: "#6B6259", taupeLight: "#9B8A7E", terra: "#C66D4F",
  border: "#EAE3D5", success: "#4A6B5C", white: "#FFFFFF",
};

const MONTANTS_RECHARGE = [10000, 25000, 50000, 100000];

export default function PaiementsPage() {
  const { solde, transactions, rechargeSolde } = useAppStore();

  const [selectedMontant, setSelectedMontant] = useState<number | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeStatus, setRechargeStatus] = useState<"idle" | "loading" | "done">("idle");

  // Calcule dynamiquement la date de la dernière recharge
  const derniereRecharge = useMemo(() => {
    const recharges = transactions.filter((t) => t.montant > 0);
    return recharges.length > 0 ? recharges[0].date : null;
  }, [transactions]);

  const openRecharge = () => {
    if (!selectedMontant) return;
    setShowRechargeModal(true);
    setRechargeStatus("idle");
  };

  const confirmRecharge = () => {
    setRechargeStatus("loading");
    // Simule la redirection CinetPay puis confirme
    // En production : appeler l'API CinetPay, attendre le webhook de confirmation
    setTimeout(() => {
      rechargeSolde(selectedMontant!, "CinetPay");
      setRechargeStatus("done");
    }, 2000);
  };

  const closeModal = () => {
    setShowRechargeModal(false);
    setRechargeStatus("idle");
    if (rechargeStatus === "done") setSelectedMontant(null);
  };

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
            {solde.toLocaleString("fr")}<span style={{ fontSize: "16px", fontWeight: 500, color: C.bronzeLight, marginLeft: "8px" }}>XOF</span>
          </div>
          {/* Date calculée dynamiquement depuis l'historique */}
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "8px" }}>
            {derniereRecharge ? `Derniere recharge : ${derniereRecharge}` : "Aucune recharge enregistree"}
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

          {/* Un seul bouton CinetPay qui agrège Wave + Orange Money + Carte */}
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
            }}>
            <CreditCard size={16} strokeWidth={2} />
            Recharger via CinetPay
          </button>

          {/* Icônes des méthodes acceptées */}
          <div className="flex items-center gap-2 mt-3">
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
          {transactions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CreditCard size={32} style={{ color: C.border, margin: "0 auto 10px" }} />
              <p style={{ fontSize: "13px", color: C.taupe }}>Aucune transaction pour l'instant.</p>
            </div>
          ) : transactions.map((tx) => {
            const isCredit = tx.montant > 0;
            return (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-4 transition-colors"
                style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.ivory}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: "40px", height: "40px", backgroundColor: isCredit ? C.emeraldSoft : C.bronzeSoft, color: isCredit ? C.emerald : C.bronze }}>
                  {isCredit ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: "13px", fontWeight: 500, color: C.anthracite }}>{tx.desc}</div>
                  <div style={{ fontSize: "11px", color: C.taupeLight, marginTop: "2px" }}>{tx.date}</div>
                </div>
                <div className="hidden sm:block shrink-0">
                  {tx.statut === "ok" ? (
                    <span className="inline-flex items-center gap-1 rounded-full" style={{ padding: "3px 8px", fontSize: "10px", fontWeight: 600, backgroundColor: C.emeraldSoft, color: C.success, fontFamily: "var(--font-heading)" }}><CheckCircle2 size={10} /> Confirme</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full" style={{ padding: "3px 8px", fontSize: "10px", fontWeight: 600, backgroundColor: C.bronzeSoft, color: C.bronze, fontFamily: "var(--font-heading)" }}><Clock size={10} /> En attente</span>
                  )}
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 700, color: isCredit ? C.success : C.anthracite, whiteSpace: "nowrap" }}>
                  {isCredit ? "+" : ""}{Math.abs(tx.montant).toLocaleString("fr")} <span style={{ fontSize: "10px", fontWeight: 400, color: C.taupe }}>XOF</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal CinetPay */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <div className="rounded-2xl w-full" style={{ maxWidth: "420px", backgroundColor: C.white, overflow: "hidden" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: C.emerald }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 700, color: C.white }}>Recharge via CinetPay</div>
              {rechargeStatus !== "loading" && (
                <button onClick={closeModal} style={{ background: "none", border: "none", color: C.bronzeLight, cursor: "pointer" }}><X size={20} /></button>
              )}
            </div>

            <div className="px-6 py-5">
              {rechargeStatus === "done" ? (
                <div className="text-center py-4">
                  <CheckCircle2 size={48} style={{ color: C.success, margin: "0 auto 12px" }} />
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.anthracite, marginBottom: "4px" }}>Recharge confirmee !</div>
                  <div style={{ fontSize: "13px", color: C.taupe, lineHeight: 1.6 }}>
                    {selectedMontant?.toLocaleString("fr")} XOF ont ete ajoutes a votre solde.
                  </div>
                  <button onClick={closeModal} className="mt-5 rounded-lg" style={{ padding: "10px 28px", backgroundColor: C.emerald, color: C.white, border: "none", fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-xl text-center mb-5" style={{ backgroundColor: C.emeraldSoft, padding: "16px" }}>
                    <div style={{ fontSize: "10px", color: C.taupe, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "6px" }}>Montant a recharger</div>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 800, color: C.emerald }}>
                      {selectedMontant?.toLocaleString("fr")} <span style={{ fontSize: "14px", color: C.taupe }}>XOF</span>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "16px", lineHeight: 1.6 }}>
                    Vous allez etre redirige vers la page de paiement <strong style={{ color: C.anthracite }}>CinetPay</strong> pour choisir votre methode (Wave, Orange Money ou carte bancaire).
                  </p>
                  {/* Méthodes disponibles via CinetPay */}
                  <div className="flex gap-2 mb-5">
                    {["Wave", "Orange Money", "Carte"].map((m) => (
                      <span key={m} style={{ fontSize: "11px", fontWeight: 600, color: C.taupe, backgroundColor: C.sage, padding: "4px 10px", borderRadius: "20px" }}>{m}</span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={closeModal} className="flex-1 rounded-lg" style={{ padding: "11px", border: `1px solid ${C.border}`, backgroundColor: C.white, color: C.taupe, fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                      Annuler
                    </button>
                    <button onClick={confirmRecharge} disabled={rechargeStatus === "loading"} className="flex-1 rounded-lg" style={{
                      padding: "11px", border: "none", backgroundColor: C.emerald, color: C.white,
                      fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600,
                      cursor: rechargeStatus === "loading" ? "wait" : "pointer",
                      opacity: rechargeStatus === "loading" ? 0.7 : 1,
                    }}>
                      {rechargeStatus === "loading" ? "Traitement..." : "Payer avec CinetPay"}
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
