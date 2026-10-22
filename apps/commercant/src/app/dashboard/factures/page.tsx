// ============================================================
// SENI CORP — Page "Factures"
// Il n'existe aucun endpoint de facturation cote backend a ce jour.
// Cette page affichait auparavant 4 factures ecrites en dur, montants
// compris : sur un site en production, c'est un document comptable
// invente. On assume l'absence plutot que de simuler.
// L'historique reel des mouvements est sur la page Paiements.
// ============================================================

"use client";

import Link from "next/link";
import { FileText, CreditCard } from "lucide-react";
import { C } from "@/lib/tokens";

export default function FacturesPage() {
  return (
    <div className="px-4 py-5 md:px-8 md:py-7 max-w-[1400px] mx-auto">
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700, color: C.anthracite, marginBottom: "6px" }}>
        Factures
      </h1>
      <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "28px" }}>
        Vos factures mensuelles consolidees.
      </p>

      <div
        className="rounded-2xl text-center"
        style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "48px 24px" }}
      >
        <div
          className="flex items-center justify-center rounded-2xl mx-auto"
          style={{ width: "56px", height: "56px", backgroundColor: C.bronzeSoft, color: C.bronze, marginBottom: "18px" }}
        >
          <FileText size={26} />
        </div>

        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.anthracite, marginBottom: "8px" }}>
          Bientot disponible
        </h2>
        <p style={{ fontSize: "13px", color: C.taupe, lineHeight: 1.7, maxWidth: "460px", margin: "0 auto 24px" }}>
          La facturation mensuelle consolidee est en cours de mise en place.
          En attendant, tu retrouves le detail de tous tes mouvements dans
          l&apos;historique des transactions. Les envois debites, les recharges
          et les remboursements y figurent tous.
        </p>

        <Link
          href="/dashboard/paiements"
          className="inline-flex items-center gap-2 rounded-lg"
          style={{
            padding: "11px 20px", backgroundColor: C.emerald, color: C.white,
            textDecoration: "none", fontFamily: "var(--font-heading)",
            fontSize: "13px", fontWeight: 600, minHeight: "44px",
          }}
        >
          <CreditCard size={15} />
          Voir mes transactions
        </Link>
      </div>

      <div className="h-8" />
    </div>
  );
}
