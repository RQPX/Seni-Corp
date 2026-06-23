// ============================================================
// SENI CORP — Page "Mes colis"
// Liste complete des colis avec recherche, filtres par statut,
// et tri par date/destination/montant.
// Chemin : src/app/dashboard/colis/page.tsx
// ============================================================

"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore, type ColisItem } from "@/store/appStore";
import {
  Search, ChevronRight, CheckCircle2, MapPin,
  Truck, Clock, Package, AlertTriangle, XCircle, Download,
  X, ArrowLeft, Copy, Phone
} from "lucide-react";

const C = {
  emerald: "#0B4D3F", emeraldLight: "#1A6B58", emeraldSoft: "#E8F0ED",
  bronze: "#B8935A", bronzeLight: "#D4B486", bronzeSoft: "#F5EFE3",
  ivory: "#FAF6F0", sage: "#E8EDE5", anthracite: "#1A1A1A",
  taupe: "#6B6259", taupeLight: "#9B8A7E", terra: "#C66D4F",
  terraSoft: "#FCEEE9", border: "#EAE3D5", success: "#4A6B5C",
  warning: "#B88838", warningSoft: "#FEF3E5", white: "#FFFFFF",
};

const STATUTS: Record<string, { label: string; bg: string; color: string; icon: typeof Clock }> = {
  tous:    { label: "Tous",       bg: C.sage,        color: C.taupe,        icon: Package },
  cree:    { label: "Cree",       bg: C.sage,        color: C.taupe,        icon: Clock },
  transit: { label: "En transit", bg: C.bronzeSoft,  color: C.bronze,       icon: Truck },
  relais:  { label: "Au relais",  bg: C.emeraldSoft, color: C.emeraldLight, icon: MapPin },
  livre:   { label: "Livre",      bg: C.emeraldSoft, color: C.success,      icon: CheckCircle2 },
  retarde: { label: "Retarde",    bg: C.warningSoft, color: C.warning,      icon: AlertTriangle },
  annule:  { label: "Annule",     bg: C.terraSoft,   color: C.terra,        icon: XCircle },
};


function StatusBadge({ statut }: { statut: string }) {
  const config = STATUTS[statut];
  if (!config || statut === "tous") return null;
  const Icon = config.icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full" style={{
      backgroundColor: config.bg, color: config.color, padding: "4px 10px",
      fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: 600, whiteSpace: "nowrap",
    }}><Icon size={11} strokeWidth={2} />{config.label}</span>
  );
}

function exportCSV(data: ColisItem[]) {
  const headers = ["Tracking", "Date", "Origine", "Destination", "Destinataire", "Telephone", "Poids", "Statut", "Montant XOF"];
  const rows = data.map((c) => [c.tracking, c.date, c.origine, c.destination, c.destinataire, c.telephone, c.poids, STATUTS[c.statut]?.label || c.statut, c.montant.toString()]);
  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `seni-corp-colis-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const PER_PAGE = 10;

export default function ColisPage() {
  // Lit la liste des colis depuis le store global (mis a jour apres chaque creation)
  const { colis } = useAppStore();

  // Lire le parametre de recherche depuis l'URL (vient de la topbar)
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [search, setSearch] = useState(urlQuery);
  const [activeFilter, setActiveFilter] = useState("tous");
  const [selectedColis, setSelectedColis] = useState<ColisItem | null>(null);
  const [page, setPage] = useState(1);

  // Mettre a jour la recherche quand l'URL change (recherche depuis la topbar)
  useEffect(() => {
    if (urlQuery) setSearch(urlQuery);
  }, [urlQuery]);

  const filtered = useMemo(() => {
    // Remet a la premiere page a chaque nouveau filtre ou recherche
    setPage(1);
    return colis.filter((c) => {
      if (activeFilter !== "tous" && c.statut !== activeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.tracking.toLowerCase().includes(q) || c.destinataire.toLowerCase().includes(q) || c.destination.toLowerCase().includes(q) || c.origine.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, activeFilter, colis]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  // Colis affiches sur la page courante
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = useMemo(() => {
    const map: Record<string, number> = { tous: colis.length };
    colis.forEach((c) => { map[c.statut] = (map[c.statut] || 0) + 1; });
    return map;
  }, [colis]);

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700, color: C.anthracite }}>Mes colis</h1>
          <p style={{ fontSize: "13px", color: C.taupe, marginTop: "4px" }}>{colis.length} colis au total</p>
        </div>
        <button onClick={() => exportCSV(filtered)} className="flex items-center gap-2 rounded-lg"
          style={{ padding: "9px 14px", fontSize: "13px", fontWeight: 500, backgroundColor: C.sage, border: `1px solid ${C.border}`, color: C.taupe, cursor: "pointer" }}>
          <Download size={15} strokeWidth={2} />Exporter CSV ({filtered.length})
        </button>
      </div>

      <div className="mb-4 relative">
        <Search size={17} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.taupeLight }} />
        <input type="text" placeholder="Rechercher par tracking, destinataire ou ville..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl" style={{ padding: "11px 14px 11px 40px", fontSize: "14px", backgroundColor: C.white, border: `1px solid ${C.border}`, color: C.anthracite, outline: "none" }} />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ background: "none", border: "none", color: C.taupeLight, cursor: "pointer" }}><X size={15} /></button>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" role="tablist">
        {Object.entries(STATUTS).map(([key, config]) => {
          const isActive = activeFilter === key;
          return (
            <button key={key} role="tab" aria-selected={isActive} onClick={() => setActiveFilter(key)}
              className="flex items-center gap-1.5 rounded-full shrink-0" style={{
                padding: "7px 14px", fontSize: "12px", fontFamily: "var(--font-heading)", fontWeight: 600,
                backgroundColor: isActive ? C.emerald : C.white, color: isActive ? C.ivory : C.taupe,
                border: `1px solid ${isActive ? C.emerald : C.border}`, cursor: "pointer",
              }}>
              {config.label}
              <span style={{ fontSize: "10px", backgroundColor: isActive ? "rgba(255,255,255,0.2)" : C.sage, padding: "1px 6px", borderRadius: "8px", fontWeight: 700 }}>{counts[key] || 0}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "780px" }}>
            <thead>
              <tr style={{ backgroundColor: C.sage }}>
                {["Tracking", "Date", "Trajet", "Destinataire", "Poids", "Statut", "Montant"].map((h) => (
                  <th key={h} className="text-left" style={{ fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: 700, color: C.taupe, letterSpacing: "1.5px", textTransform: "uppercase", padding: "10px 16px" }}>{h}</th>
                ))}
                <th style={{ width: "44px" }}><span className="sr-only">Detail</span></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "48px 16px", textAlign: "center" }}>
                  <Package size={32} style={{ color: C.border, margin: "0 auto 12px" }} />
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 600, color: C.taupe }}>Aucun colis trouve</p>
                  <p style={{ fontSize: "12px", color: C.taupeLight, marginTop: "4px" }}>Essaie un autre terme ou filtre.</p>
                </td></tr>
              ) : paginated.map((colis, idx) => (
                <tr key={colis.tracking} onClick={() => setSelectedColis(colis)}
                  className="transition-colors duration-150 cursor-pointer"
                  style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: idx % 2 === 0 ? "transparent" : C.ivory }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.sage}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : C.ivory}>
                  <td style={{ padding: "12px 16px" }}><span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", fontWeight: 600, color: C.emerald }}>{colis.tracking}</span></td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: C.taupe }}>{colis.date}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: C.anthracite }}><strong>{colis.origine}</strong><span style={{ color: C.bronze, margin: "0 6px" }}>{"\u2192"}</span><strong>{colis.destination}</strong></td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: C.taupe }}>{colis.destinataire}</td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: C.taupe }}>{colis.poids}</td>
                  <td style={{ padding: "12px 16px" }}><StatusBadge statut={colis.statut} /></td>
                  <td style={{ padding: "12px 16px", fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: C.anthracite }}>{colis.montant.toLocaleString("fr")} <span style={{ color: C.taupe, fontSize: "11px", fontWeight: 400 }}>XOF</span></td>
                  <td style={{ padding: "12px 10px" }}><ChevronRight size={16} style={{ color: C.taupeLight }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <span style={{ fontSize: "12px", color: C.taupe }}>
            {filtered.length === 0 ? "0 colis" : `${(page - 1) * PER_PAGE + 1}\u2013${Math.min(page * PER_PAGE, filtered.length)} sur ${filtered.length} colis`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg"
                style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-heading)", backgroundColor: page === 1 ? C.sage : C.white, border: `1px solid ${C.border}`, color: page === 1 ? C.taupeLight : C.taupe, cursor: page === 1 ? "not-allowed" : "pointer" }}>
                Precedent
              </button>
              <span style={{ fontSize: "12px", color: C.taupe, padding: "0 4px" }}>Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg"
                style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-heading)", backgroundColor: page === totalPages ? C.sage : C.emerald, border: "none", color: page === totalPages ? C.taupeLight : C.white, cursor: page === totalPages ? "not-allowed" : "pointer" }}>
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedColis && (
        <>
          <div className="fixed inset-0 z-[60]" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setSelectedColis(null)} />
          <div className="fixed top-0 right-0 z-[70] h-full overflow-y-auto" style={{ width: "min(440px, 100vw)", backgroundColor: C.white, borderLeft: `1px solid ${C.border}` }}>
            <div className="sticky top-0 flex items-center gap-3 px-5 py-4 z-10" style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.border}` }}>
              <button onClick={() => setSelectedColis(null)} style={{ background: "none", border: "none", color: C.taupe, cursor: "pointer" }}><ArrowLeft size={20} /></button>
              <div className="flex-1"><div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 700, color: C.anthracite }}>Detail du colis</div></div>
              <StatusBadge statut={selectedColis.statut} />
            </div>
            <div className="p-5 space-y-5">
              <div className="rounded-xl text-center" style={{ backgroundColor: C.emeraldSoft, padding: "20px" }}>
                <div style={{ fontSize: "10px", color: C.taupe, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: "8px" }}>Numero de suivi</div>
                <div className="flex items-center justify-center gap-2">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: C.emerald, letterSpacing: "1px" }}>{selectedColis.tracking}</span>
                  <button onClick={() => navigator.clipboard.writeText(selectedColis.tracking)} style={{ background: "none", border: "none", color: C.emeraldLight, cursor: "pointer" }}><Copy size={16} /></button>
                </div>
              </div>
              <div className="rounded-xl" style={{ border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {[
                  { label: "Trajet", value: `${selectedColis.origine} \u2192 ${selectedColis.destination}` },
                  { label: "Date", value: selectedColis.date },
                  { label: "Service", value: selectedColis.service },
                  { label: "Poids", value: selectedColis.poids },
                  { label: "Contenu", value: selectedColis.contenu },
                  { label: "Montant", value: `${selectedColis.montant.toLocaleString("fr")} XOF` },
                ].map((row, i) => (
                  <div key={row.label} className="flex justify-between px-4 py-3" style={{ borderBottom: i < 5 ? `1px solid ${C.border}` : "none", backgroundColor: i % 2 === 0 ? "transparent" : C.ivory }}>
                    <span style={{ fontSize: "12px", color: C.taupe }}>{row.label}</span>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: C.anthracite, textAlign: "right" }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 700, color: C.anthracite, marginBottom: "10px" }}>Destinataire</div>
                <div className="flex items-center gap-3 rounded-xl p-4" style={{ backgroundColor: C.sage }}>
                  <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: "40px", height: "40px", backgroundColor: C.emeraldSoft, color: C.emerald, fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 700 }}>
                    {selectedColis.destinataire.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <div style={{ fontSize: "14px", fontWeight: 500, color: C.anthracite }}>{selectedColis.destinataire}</div>
                    <div style={{ fontSize: "12px", color: C.taupe }}>{selectedColis.telephone}</div>
                  </div>
                  <a href={`tel:${selectedColis.telephone}`} className="flex items-center justify-center rounded-lg" style={{ width: "36px", height: "36px", backgroundColor: C.emerald, color: C.white, textDecoration: "none" }}><Phone size={15} /></a>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: C.bronzeSoft, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "11px", color: C.taupe, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Lien de suivi public</div>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: C.bronze, flex: 1 }}>seni-corp.ci/t/{selectedColis.tracking}</span>
                  <button onClick={() => navigator.clipboard.writeText(`seni-corp.ci/t/${selectedColis.tracking}`)} className="rounded-md" style={{ padding: "4px 10px", fontSize: "11px", backgroundColor: C.bronze, color: C.white, border: "none", cursor: "pointer", fontWeight: 600 }}>Copier</button>
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