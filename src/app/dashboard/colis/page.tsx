// ============================================================
// SENI CORP — Page "Mes colis"
// Liste des colis du client connecte. La recherche, le filtre et la
// pagination sont faits par le serveur : la page ne fait qu'afficher
// ce que l'API renvoie.
// ============================================================

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ChevronRight, Package, AlertTriangle, Download, X } from "lucide-react";
import { FilterTabs, type FilterOption } from "@/components/ui/FilterTabs";
import { ColisDetailPanel, StatutBadge } from "@/components/ColisDetailPanel";
import { STATUTS, statutConfig, LABELS_SERVICE, type StatutColis } from "@/lib/statuts";
import { formatDateFr, formatPoids } from "@/lib/utils";
import { useColis } from "@/lib/queries";
import type { Colis } from "@/lib/api";
import { C } from "@/lib/tokens";

// Nombre de colis demandes au serveur par page (plafonne a 100 cote backend)
const PAR_PAGE = 10;

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
                    <StatutBadge statut={colis.statut} />
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
      {/* -- Panneau lateral : detail d'un colis (composant partage) -- */}
      {selectedColis && (
        <ColisDetailPanel colis={selectedColis} onClose={() => setSelectedColis(null)} />
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
