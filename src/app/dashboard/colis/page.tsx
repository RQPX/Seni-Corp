// ============================================================
// SENI CORP — Page "Mes colis"
// Liste des colis du client connecte. La recherche, le filtre et la
// pagination sont faits par le serveur : la page ne fait qu'afficher
// ce que l'API renvoie.
// ============================================================

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search, ChevronRight, CheckCircle2, MapPin,
  Truck, Clock, Package, AlertTriangle, XCircle, RotateCcw, Download,
  X, ArrowLeft, Copy, Phone
} from "lucide-react";
import { FilterTabs, type FilterOption } from "@/components/ui/FilterTabs";
import { STATUTS, statutConfig, LABELS_SERVICE, type StatutColis } from "@/lib/statuts";
import { formatDateFr, formatPoids } from "@/lib/utils";
import { useColis } from "@/lib/queries";
import type { Colis } from "@/lib/api";
import { C } from "@/lib/tokens";

// Icone de chaque statut (couleurs et libelle lus depuis statutConfig)
const STATUT_ICONS: Record<string, typeof Clock> = {
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

// Nombre de colis demandes au serveur par page (plafonne a 100 cote backend)
const PAR_PAGE = 10;

// -- Badge de statut (etiquette coloree avec icone) --
function StatusBadge({ statut }: { statut: string }) {
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

// -- Export CSV de la page courante --
// BOM UTF-8 (﻿) pour qu'Excel ouvre correctement les accents
function exportCSV(data: Colis[]) {
  const headers = ["Tracking", "Date", "Origine", "Destination", "Destinataire", "Telephone", "Poids", "Statut", "Montant XOF"];
  const rows = data.map((c) => [
    c.tracking,
    formatDateFr(c.createdAt),
    c.origine.ville,
    c.destination.ville,
    c.destinataireNom,
    c.destinataireTel,
    formatPoids(c.poidsGrammes),
    statutConfig(c.statut).label,
    c.montant.toString(),
  ]);
  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `seni-corp-colis-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// -- Options du filtre : tous les statuts du backend --
const FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "Tous" },
  ...Object.entries(STATUTS).map(([cle, config]) => ({
    value: cle,
    label: config.label,
  })),
];


// ============================================================
// Composant interne isole (pour useSearchParams + Suspense)
// ============================================================
function ColisPageInner() {
  // -- Lecture du parametre "q" dans l'URL (?q=...) --
  // Utilise quand on vient de la barre de recherche de la topbar
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [search, setSearch] = useState(urlQuery);
  const [rechercheEnvoyee, setRechercheEnvoyee] = useState(urlQuery);
  const [activeFilter, setActiveFilter] = useState("");
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [page, setPage] = useState(1);

  // Synchro : si l'URL change, on met a jour la recherche
  useEffect(() => {
    if (urlQuery) setSearch(urlQuery);
  }, [urlQuery]);

  // La recherche part au serveur : on attend 400 ms de pause a la frappe
  // pour ne pas declencher une requete par caractere.
  useEffect(() => {
    const t = setTimeout(() => setRechercheEnvoyee(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Retour a la page 1 quand le filtre ou la recherche change
  useEffect(() => { setPage(1); }, [rechercheEnvoyee, activeFilter]);

  const { data, isPending, isError, error } = useColis({
    statut: (activeFilter || undefined) as StatutColis | undefined,
    recherche: rechercheEnvoyee || undefined,
    page,
    parPage: PAR_PAGE,
  });

  const elements = data?.elements ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;

  return (
    <div
      className="px-4 py-5 md:px-8 md:py-7 mx-auto"
      style={{ maxWidth: "1400px", width: "100%", minWidth: 0 }}
    >
      {/* -- En-tete : titre + bouton export CSV -- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700, color: C.anthracite }}>
            Mes colis
          </h1>
          <p style={{ fontSize: "13px", color: C.taupe, marginTop: "4px" }}>
            {total} colis au total
          </p>
        </div>
        <button
          onClick={() => exportCSV(elements)}
          disabled={elements.length === 0}
          className="flex items-center gap-2 rounded-lg self-start sm:self-auto"
          style={{
            padding: "9px 14px", fontSize: "13px", fontWeight: 500,
            backgroundColor: C.sage, border: `1px solid ${C.border}`,
            color: C.taupe,
            cursor: elements.length === 0 ? "not-allowed" : "pointer",
            opacity: elements.length === 0 ? 0.6 : 1,
            minHeight: "40px",
          }}
        >
          <Download size={15} strokeWidth={2} />
          Exporter cette page ({elements.length})
        </button>
      </div>

      {/* -- Barre de recherche -- */}
      <div className="mb-4 relative">
        <Search
          size={17} strokeWidth={1.8}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: C.taupeLight }}
        />
        <input
          type="text"
          placeholder="Tracking, destinataire ou ville..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl"
          style={{
            padding: "12px 40px 12px 40px",
            fontSize: "16px", // 16px = pas de zoom automatique sur iOS
            backgroundColor: C.white, border: `1px solid ${C.border}`,
            color: C.anthracite, outline: "none",
            minHeight: "44px",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            style={{ background: "none", border: "none", color: C.taupeLight, cursor: "pointer", minWidth: "32px", minHeight: "32px" }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* -- FILTRES : dropdown natif sur mobile, pilules sur desktop -- */}
      <FilterTabs
        options={FILTER_OPTIONS}
        value={activeFilter}
        onChange={setActiveFilter}
        ariaLabel="Filtrer les colis par statut"
      />

      {/* -- Tableau des colis -- */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: C.white,
          border: `1px solid ${C.border}`,
          maxWidth: "100%",
          minWidth: 0,
        }}
      >
        {/* scroll-x-contain : le tableau scrolle horizontalement en interne */}
        {/* sans pousser toute la page vers la droite */}
        <div className="scroll-x-contain">
          <table className="w-full" style={{ minWidth: "780px" }}>
            <thead>
              <tr style={{ backgroundColor: C.sage }}>
                {["Tracking", "Date", "Trajet", "Destinataire", "Poids", "Statut", "Montant"].map((h) => (
                  <th
                    key={h}
                    className="text-left"
                    style={{
                      fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: 700,
                      color: C.taupe, letterSpacing: "1.5px", textTransform: "uppercase",
                      padding: "10px 16px",
                    }}
                  >
                    {h}
                  </th>
                ))}
                <th style={{ width: "44px" }}>
                  <span className="sr-only">Detail</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 16px", textAlign: "center", fontSize: "13px", color: C.taupe }}>
                    Chargement...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 16px", textAlign: "center" }}>
                    <AlertTriangle size={32} style={{ color: C.terra, margin: "0 auto 12px" }} />
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 600, color: C.anthracite }}>
                      Impossible de charger les colis
                    </p>
                    <p style={{ fontSize: "12px", color: C.taupe, marginTop: "4px" }}>
                      {error instanceof Error ? error.message : "Reessaie dans un instant."}
                    </p>
                  </td>
                </tr>
              ) : elements.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 16px", textAlign: "center" }}>
                    <Package size={32} style={{ color: C.border, margin: "0 auto 12px" }} />
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 600, color: C.taupe }}>
                      Aucun colis trouve
                    </p>
                    <p style={{ fontSize: "12px", color: C.taupeLight, marginTop: "4px" }}>
                      Essaie un autre terme ou filtre.
                    </p>
                  </td>
                </tr>
              ) : elements.map((colis, idx) => (
                <tr
                  key={colis.id}
                  onClick={() => setSelectedColis(colis)}
                  className="transition-colors duration-150 cursor-pointer"
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    backgroundColor: idx % 2 === 0 ? "transparent" : C.ivory,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.sage}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : C.ivory}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", fontWeight: 600, color: C.emerald }}>
                      {colis.tracking}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: C.taupe }}>{formatDateFr(colis.createdAt)}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: C.anthracite }}>
                    <strong>{colis.origine.ville}</strong>
                    <span style={{ color: C.bronze, margin: "0 6px" }}>{"→"}</span>
                    <strong>{colis.destination.ville}</strong>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: C.taupe }}>{colis.destinataireNom}</td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: C.taupe }}>{formatPoids(colis.poidsGrammes)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge statut={colis.statut} />
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: C.anthracite }}>
                    {colis.montant.toLocaleString("fr")}
                    <span style={{ color: C.taupe, fontSize: "11px", fontWeight: 400 }}> XOF</span>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <ChevronRight size={16} style={{ color: C.taupeLight }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* -- Pagination (cote serveur) -- */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <span style={{ fontSize: "12px", color: C.taupe }}>
            {total === 0
              ? "0 colis"
              : `${(page - 1) * PAR_PAGE + 1}–${Math.min(page * PAR_PAGE, total)} sur ${total} colis`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg"
                style={{
                  padding: "8px 14px", fontSize: "12px", fontWeight: 600,
                  fontFamily: "var(--font-heading)",
                  backgroundColor: page === 1 ? C.sage : C.white,
                  border: `1px solid ${C.border}`,
                  color: page === 1 ? C.taupeLight : C.taupe,
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  minHeight: "40px",
                }}
              >
                Precedent
              </button>
              <span style={{ fontSize: "12px", color: C.taupe, padding: "0 4px" }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg"
                style={{
                  padding: "8px 14px", fontSize: "12px", fontWeight: 600,
                  fontFamily: "var(--font-heading)",
                  backgroundColor: page >= totalPages ? C.sage : C.emerald,
                  border: "none",
                  color: page >= totalPages ? C.taupeLight : C.white,
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                  minHeight: "40px",
                }}
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* -- Panneau lateral : detail d'un colis -- */}
      {selectedColis && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setSelectedColis(null)}
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
            {/* En-tete du panneau (sticky) */}
            <div
              className="sticky top-0 flex items-center gap-3 px-5 py-4 z-10"
              style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.border}` }}
            >
              <button
                onClick={() => setSelectedColis(null)}
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
              <StatusBadge statut={selectedColis.statut} />
            </div>

            {/* Contenu du panneau */}
            <div className="p-5 space-y-5">
              {/* Numero de tracking + copier */}
              <div className="rounded-xl text-center" style={{ backgroundColor: C.emeraldSoft, padding: "20px" }}>
                <div style={{ fontSize: "10px", color: C.taupe, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "8px" }}>
                  Numero de suivi
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: C.emerald, letterSpacing: "1px" }}>
                    {selectedColis.tracking}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedColis.tracking)}
                    aria-label="Copier le numero de suivi"
                    style={{ background: "none", border: "none", color: C.emeraldLight, cursor: "pointer", minWidth: "32px", minHeight: "32px" }}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {/* Informations principales */}
              <div className="rounded-xl" style={{ border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {[
                  { label: "Trajet",     value: `${selectedColis.origine.ville} → ${selectedColis.destination.ville}` },
                  { label: "Relais",     value: `${selectedColis.origine.nom} → ${selectedColis.destination.nom}` },
                  { label: "Date",       value: formatDateFr(selectedColis.createdAt) },
                  { label: "Service",    value: LABELS_SERVICE[selectedColis.service] },
                  { label: "Poids",      value: formatPoids(selectedColis.poidsGrammes) },
                  { label: "Contenu",    value: selectedColis.description ?? "Non specifie" },
                  { label: "Transport",  value: `${selectedColis.montantTransport.toLocaleString("fr")} XOF` },
                  { label: "Supplement", value: `${selectedColis.montantSupplement.toLocaleString("fr")} XOF` },
                  { label: "Total",      value: `${selectedColis.montant.toLocaleString("fr")} XOF` },
                ].map((row, i, tab) => (
                  <div
                    key={row.label}
                    className="flex justify-between px-4 py-3 gap-3"
                    style={{
                      borderBottom: i < tab.length - 1 ? `1px solid ${C.border}` : "none",
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
                    {selectedColis.destinataireNom.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: "14px", fontWeight: 500, color: C.anthracite, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {selectedColis.destinataireNom}
                    </div>
                    <div style={{ fontSize: "12px", color: C.taupe }}>{selectedColis.destinataireTel}</div>
                    {selectedColis.destinataireAdresse && (
                      <div style={{ fontSize: "11px", color: C.taupeLight, marginTop: "2px" }}>
                        {selectedColis.destinataireAdresse}
                      </div>
                    )}
                  </div>
                  <a
                    href={`tel:${selectedColis.destinataireTel}`}
                    aria-label={`Appeler ${selectedColis.destinataireNom}`}
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
                    seni-corp.ci/t/{selectedColis.tracking}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(`https://seni-corp.ci/t/${selectedColis.tracking}`)}
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
      )}

      <div className="h-8" />
    </div>
  );
}


// ============================================================
// Export : la page est enveloppee dans un Suspense
// C'est requis par Next.js 15 quand on utilise useSearchParams
// ============================================================
export default function ColisPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-8 text-center" style={{ color: "#6B6259" }}>
          Chargement...
        </div>
      }
    >
      <ColisPageInner />
    </Suspense>
  );
}
