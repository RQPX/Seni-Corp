// ============================================================
// SENI CORP — Panneau de detail d'un colis
// Partage entre le tableau de bord et la liste "Mes colis" :
// les deux ouvrent la meme fiche, il ne doit y en avoir qu'une.
// ============================================================

"use client";

import {
  CheckCircle2, MapPin, Truck, Clock, Package, AlertTriangle,
  XCircle, RotateCcw, ArrowLeft, Copy, Phone,
} from "lucide-react";
import { statutConfig, LABELS_SERVICE } from "@/lib/statuts";
import { formatDateFr, formatPoids } from "@/lib/utils";
import { C } from "@/lib/tokens";
import type { Colis } from "@/lib/api";

// Icone de chaque statut. Les couleurs et libelles viennent de statutConfig.
export const STATUT_ICONS: Record<string, typeof Clock> = {
  CREE:               Clock,
  PRIS_EN_CHARGE:     Package,
  EN_TRANSIT:         Truck,
  ARRIVE_HUB:         MapPin,
  EN_ATTENTE_RETRAIT: MapPin,
  EN_LIVRAISON:       Truck,
  LIVRE:              CheckCircle2,
  RETOURNE:           RotateCcw,
  PERDU:              XCircle,
  INCIDENT:           AlertTriangle,
  ANNULE:             XCircle,
};

export function StatutBadge({ statut }: { statut: string }) {
  const config = statutConfig(statut);
  const Icon = STATUT_ICONS[statut];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{
        backgroundColor: config.bg, color: config.color,
        padding: "4px 10px",
        fontFamily: "var(--font-heading)",
        fontSize: "10px", fontWeight: 600, whiteSpace: "nowrap",
      }}
    >
      {Icon && <Icon size={11} strokeWidth={2} />}
      {config.label}
    </span>
  );
}

export function ColisDetailPanel({ colis, onClose }: { colis: Colis; onClose: () => void }) {
  const lignes = [
    { label: "Trajet",     value: `${colis.origine.ville} → ${colis.destination.ville}` },
    { label: "Relais",     value: `${colis.origine.nom} → ${colis.destination.nom}` },
    { label: "Date",       value: formatDateFr(colis.createdAt) },
    { label: "Service",    value: LABELS_SERVICE[colis.service] },
    { label: "Poids",      value: formatPoids(colis.poidsGrammes) },
    { label: "Contenu",    value: colis.description ?? "Non specifie" },
    { label: "Transport",  value: `${colis.montantTransport.toLocaleString("fr")} XOF` },
    { label: "Supplement", value: `${colis.montantSupplement.toLocaleString("fr")} XOF` },
    { label: "Total",      value: `${colis.montant.toLocaleString("fr")} XOF` },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-[60]"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed top-0 right-0 z-[70]"
        style={{
          width: "min(440px, 100%)",
          maxWidth: "100%",
          height: "100dvh",
          backgroundColor: C.white,
          borderLeft: `1px solid ${C.border}`,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
        role="dialog"
        aria-label="Detail du colis"
      >
        {/* En-tete du panneau (reste visible au defilement) */}
        <div
          className="sticky top-0 flex items-center gap-3 px-5 py-4 z-10"
          style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.border}` }}
        >
          <button
            onClick={onClose}
            aria-label="Fermer le detail"
            style={{ background: "none", border: "none", color: C.taupe, cursor: "pointer", minWidth: "40px", minHeight: "40px" }}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 700, color: C.anthracite }}>
              Detail du colis
            </div>
          </div>
          <StatutBadge statut={colis.statut} />
        </div>

        <div className="p-5 space-y-5">
          {/* Numero de suivi */}
          <div className="rounded-xl text-center" style={{ backgroundColor: C.emeraldSoft, padding: "20px" }}>
            <div style={{ fontSize: "10px", color: C.taupe, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "8px" }}>
              Numero de suivi
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: C.emerald, letterSpacing: "1px" }}>
                {colis.tracking}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(colis.tracking)}
                aria-label="Copier le numero de suivi"
                style={{ background: "none", border: "none", color: C.emeraldLight, cursor: "pointer", minWidth: "32px", minHeight: "32px" }}
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          {/* Informations principales */}
          <div className="rounded-xl" style={{ border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {lignes.map((row, i) => (
              <div
                key={row.label}
                className="flex justify-between px-4 py-3 gap-3"
                style={{
                  borderBottom: i < lignes.length - 1 ? `1px solid ${C.border}` : "none",
                  backgroundColor: i % 2 === 0 ? "transparent" : C.ivory,
                }}
              >
                <span style={{ fontSize: "12px", color: C.taupe, flexShrink: 0 }}>{row.label}</span>
                <span style={{
                  fontSize: "12px", fontWeight: 500, color: C.anthracite,
                  textAlign: "right", overflowWrap: "break-word", minWidth: 0,
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Destinataire */}
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 700, color: C.anthracite, marginBottom: "10px" }}>
              Destinataire
            </div>
            <div className="flex items-center gap-3 rounded-xl p-4" style={{ backgroundColor: C.sage }}>
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: "40px", height: "40px",
                  backgroundColor: C.emeraldSoft, color: C.emerald,
                  fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 700,
                }}
              >
                {colis.destinataireNom.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: "14px", fontWeight: 500, color: C.anthracite, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {colis.destinataireNom}
                </div>
                <div style={{ fontSize: "12px", color: C.taupe }}>{colis.destinataireTel}</div>
                {colis.destinataireAdresse && (
                  <div style={{ fontSize: "11px", color: C.taupeLight, marginTop: "2px" }}>
                    {colis.destinataireAdresse}
                  </div>
                )}
              </div>
              <a
                href={`tel:${colis.destinataireTel}`}
                aria-label={`Appeler ${colis.destinataireNom}`}
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: "40px", height: "40px",
                  backgroundColor: C.emerald, color: C.white,
                  textDecoration: "none",
                }}
              >
                <Phone size={15} />
              </a>
            </div>
          </div>

          {/* Lien public de suivi */}
          <div className="rounded-xl p-4" style={{ backgroundColor: C.bronzeSoft, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "11px", color: C.taupe, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
              Lien de suivi public
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "12px", color: C.bronze,
                flex: 1, minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                seni-corp.ci/t/{colis.tracking}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(`https://seni-corp.ci/t/${colis.tracking}`)}
                className="rounded-md shrink-0"
                style={{
                  padding: "6px 12px", fontSize: "11px",
                  backgroundColor: C.bronze, color: C.white,
                  border: "none", cursor: "pointer", fontWeight: 600,
                  minHeight: "32px",
                }}
              >
                Copier
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
