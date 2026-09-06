// ============================================================
// SENI CORP — Page "Mes colis"
// Liste complete des colis du commercant.
// L'utilisateur peut :
//   - Rechercher par tracking, destinataire ou ville
//   - Filtrer par statut (livre, en transit, retarde...)
//   - Exporter la liste en CSV
//   - Cliquer sur un colis pour voir son detail (panneau lateral)
// ============================================================

"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore, type ColisItem } from "@/store/appStore";
import {
  Search, ChevronRight, CheckCircle2, MapPin,
  Truck, Clock, Package, AlertTriangle, XCircle, RotateCcw, Download,
  X, ArrowLeft, Copy, Phone
} from "lucide-react";
import { FilterTabs, type FilterOption } from "@/components/ui/FilterTabs";
import { STATUTS, statutConfig } from "@/lib/statuts";
import { formatDateFr } from "@/lib/utils";

const C = {
  emerald: "#0B4D3F", emeraldLight: "#1A6B58", emeraldSoft: "#E8F0ED",
  bronze: "#B8935A", bronzeLight: "#D4B486", bronzeSoft: "#F5EFE3",
  ivory: "#FAF6F0", sage: "#E8EDE5", anthracite: "#1A1A1A",
  taupe: "#6B6259", taupeLight: "#9B8A7E", terra: "#C66D4F",
  terraSoft: "#FCEEE9", border: "#EAE3D5", success: "#4A6B5C",
  warning: "#B88838", warningSoft: "#FEF3E5", white: "#FFFFFF",
};

// Icone de chaque statut (couleurs et libelle lus depuis statutConfig)
const STATUT_ICONS: Record<string, typeof Clock> = {
  cree:       Clock,
  pris:       Package,
  transit:    Truck,
  arrive_hub: MapPin,
  attente:    MapPin,
  livraison:  Truck,
  livre:      CheckCircle2,
  retarde:    AlertTriangle,
  incident:   AlertTriangle,
  retourne:   RotateCcw,
  perdu:      XCircle,
  annule:     XCircle,
};

// -- Badge de statut (etiquette coloree avec icone) --
function StatusBadge({ statut }: { statut: string }) {
  if (statut === "tous") return null;
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

// -- Export CSV de la liste des colis --
// BOM UTF-8 (\uFEFF) pour qu'Excel ouvre correctement les accents
function exportCSV(data: ColisItem[]) {
  const headers = ["Tracking", "Date", "Origine", "Destination", "Destinataire", "Telephone", "Poids", "Statut", "Montant XOF"];
  const rows = data.map((c) => [
    c.tracking, formatDateFr(c.createdAt), c.origine, c.destination,
    c.destinataire, c.telephone, c.poids,
    statutConfig(c.statut).label, c.montant.toString(),
  ]);
  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `seni-corp-colis-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Nombre de colis affiches par page
const PER_PAGE = 10;


// ============================================================
// Composant interne isole (pour useSearchParams + Suspense)
// ============================================================
function ColisPageInner() {
  // Lit la liste depuis le store global
  const { colis } = useAppStore();

  // -- Lecture du parametre "q" dans l'URL (?q=...) --
  // Utilise quand on vient de la barre de recherche de la topbar
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [search, setSearch] = useState(urlQuery);
  const [activeFilter, setActiveFilter] = useState("tous");
  const [selectedColis, setSelectedColis] = useState<ColisItem | null>(null);
  const [page, setPage] = useState(1);

  // Synchro : si l'URL change, on met a jour la recherche
  useEffect(() => {
    if (urlQuery) setSearch(urlQuery);
  }, [urlQuery]);

  // -- Filtrage : par statut ET par texte de recherche --
  const filtered = useMemo(() => {
    return colis.filter((c) => {
      if (activeFilter !== "tous" && c.statut !== activeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.tracking.toLowerCase().includes(q) ||
          c.destinataire.toLowerCase().includes(q) ||
          c.destination.toLowerCase().includes(q) ||
          c.origine.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, activeFilter, colis]);

  // Retour a la page 1 quand le filtre ou la recherche change
  useEffect(() => { setPage(1); }, [search, activeFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  // Garde-fou : si la liste retrecit, on ne reste pas sur une page vide
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // Compteurs par statut (affiches dans les filtres)
  const counts = useMemo(() => {
    const map: Record<string, number> = { tous: colis.length };
    colis.forEach((c) => {
      map[c.statut] = (map[c.statut] || 0) + 1;
    });
    return map;
  }, [colis]);

  // -- Options du composant FilterTabs --
  const filterOptions: FilterOption[] = [
    { value: "tous", label: "Tous", count: counts.tous || 0 },
    ...Object.entries(STATUTS).map(([key, config]) => ({
      value: key,
      label: config.label,
      count: counts[key] || 0,
    })),
  ];

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
            {colis.length} colis au total
          </p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 rounded-lg self-start sm:self-auto"
          style={{
            padding: "9px 14px", fontSize: "13px", fontWeight: 500,
            backgroundColor: C.sage, border: `1px solid ${C.border}`,
            color: C.taupe, cursor: "pointer",
            minHeight: "40px",
          }}
        >
          <Download size={15} strokeWidth={2} />
          Exporter CSV ({filtered.length})
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
        options={filterOptions}
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
              {paginated.length === 0 ? (
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
              ) : paginated.map((colis, idx) => (
                <tr
                  key={colis.tracking}
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
                    <strong>{colis.origine}</strong>
                    <span style={{ color: C.bronze, margin: "0 6px" }}>{"\u2192"}</span>
                    <strong>{colis.destination}</strong>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: C.taupe }}>{colis.destinataire}</td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: C.taupe }}>{colis.poids}</td>
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

        {/* -- Pagination -- */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <span style={{ fontSize: "12px", color: C.taupe }}>
            {filtered.length === 0
              ? "0 colis"
              : `${(safePage - 1) * PER_PAGE + 1}\u2013${Math.min(safePage * PER_PAGE, filtered.length)} sur ${filtered.length} colis`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="rounded-lg"
                style={{
                  padding: "8px 14px", fontSize: "12px", fontWeight: 600,
                  fontFamily: "var(--font-heading)",
                  backgroundColor: safePage === 1 ? C.sage : C.white,
                  border: `1px solid ${C.border}`,
                  color: safePage === 1 ? C.taupeLight : C.taupe,
                  cursor: safePage === 1 ? "not-allowed" : "pointer",
                  minHeight: "40px",
                }}
              >
                Precedent
              </button>
              <span style={{ fontSize: "12px", color: C.taupe, padding: "0 4px" }}>
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="rounded-lg"
                style={{
                  padding: "8px 14px", fontSize: "12px", fontWeight: 600,
                  fontFamily: "var(--font-heading)",
                  backgroundColor: safePage === totalPages ? C.sage : C.emerald,
                  border: "none",
                  color: safePage === totalPages ? C.taupeLight : C.white,
                  cursor: safePage === totalPages ? "not-allowed" : "pointer",
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
              // Utilise dvh pour bien s'adapter aux barres iOS
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
                  { label: "Trajet",       value: `${selectedColis.origine} \u2192 ${selectedColis.destination}` },
                  { label: "Date",         value: formatDateFr(selectedColis.createdAt) },
                  { label: "Service",      value: selectedColis.service },
                  { label: "Poids",        value: selectedColis.poids },
                  { label: "Contenu",      value: selectedColis.contenu },
                  { label: "Montant",      value: `${selectedColis.montant.toLocaleString("fr")} XOF` },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    className="flex justify-between px-4 py-3 gap-3"
                    style={{
                      borderBottom: i < 5 ? `1px solid ${C.border}` : "none",
                      backgroundColor: i % 2 === 0 ? "transparent" : C.ivory,
                    }}
                  >
                    <span style={{ fontSize: "12px", color: C.taupe, flexShrink: 0 }}>{row.label}</span>
                    <span style={{
                      fontSize: "12px", fontWeight: 500, color: C.anthracite,
                      textAlign: "right",
                      overflowWrap: "break-word",
                      minWidth: 0,
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
                    {selectedColis.destinataire.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: "14px", fontWeight: 500, color: C.anthracite, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {selectedColis.destinataire}
                    </div>
                    <div style={{ fontSize: "12px", color: C.taupe }}>{selectedColis.telephone}</div>
                  </div>
                  <a
                    href={`tel:${selectedColis.telephone}`}
                    aria-label={`Appeler ${selectedColis.destinataire}`}
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
