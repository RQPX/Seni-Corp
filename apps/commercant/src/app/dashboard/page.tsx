// ============================================================
// SENI CORP — Page Tableau de bord
// Page d'accueil du client apres connexion.
// Toutes les donnees viennent du backend : solde, colis, activite.
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { ColisDetailPanel, StatutBadge } from "@/components/ColisDetailPanel";
import { type StatutColis } from "@/lib/statuts";
import { formatDateFr } from "@/lib/utils";
import { useColis, useProfil, useTransactions } from "@/lib/queries";
import type { Colis } from "@/lib/api";
import { C } from "@/lib/tokens";

// Mois en francais pour le graphique
const MOIS = ["jan","fev","mar","avr","mai","jun","jul","aou","sep","oct","nov","dec"];

// Options du filtre affichees en haut du tableau
const FILTER_OPTIONS = [
  { value: "",                   label: "Tous" },
  { value: "LIVRE",              label: "Livres" },
  { value: "EN_ATTENTE_RETRAIT", label: "En attente retrait" },
  { value: "EN_TRANSIT",         label: "En transit" },
  { value: "CREE",               label: "Crees" },
];

// Nombre de colis charges pour alimenter le graphique et l'activite recente
const TAILLE_APERCU = 50;

// -- Info-bulle personnalisee du graphique --
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg shadow-lg" style={{ backgroundColor: C.emerald, padding: "10px 14px" }}>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: "10px", color: C.bronzeLight, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.white }}>
        {payload[0].value} colis
      </div>
    </div>
  );
}

// -- Carte KPI reutilisable --
// featured = fond emeraude pour l'indicateur principal
function KpiCard({ label, value, unit, trendLabel, featured = false }: {
  label: string; value: string; unit?: string; trendLabel: string; featured?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        backgroundColor: featured ? C.emerald : C.white,
        border: featured ? "none" : `1px solid ${C.border}`,
        padding: "22px",
        // Empeche la carte de deborder de sa colonne de grille
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      {/* Halo decoratif en haut a droite pour la carte principale */}
      {featured && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-20px", right: "-20px",
            width: "100px", height: "100px",
            background: `radial-gradient(circle, ${C.bronze} 0%, transparent 70%)`,
            opacity: 0.35,
          }}
        />
      )}
      <div style={{
        fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: 600,
        letterSpacing: "1.5px", textTransform: "uppercase",
        color: featured ? C.bronzeLight : C.taupe,
        marginBottom: "12px",
      }}>
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span style={{
          fontFamily: "var(--font-heading)", fontSize: "30px", fontWeight: 700,
          color: featured ? C.white : C.anthracite, lineHeight: 1,
          wordBreak: "break-word",
        }}>
          {value}
        </span>
        {unit && (
          <span style={{
            fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 500,
            color: featured ? C.bronzeLight : C.taupe,
          }}>
            {unit}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 mt-2.5" style={{
        fontSize: "11px", fontWeight: 500,
        color: featured ? C.bronzeLight : C.success,
      }}>
        <ArrowUpRight size={13} strokeWidth={2.5} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{trendLabel}</span>
      </div>
    </div>
  );
}


// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState("");
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);

  // Profil et solde (le solde n'est jamais calcule ici)
  const { data: profil } = useProfil();

  // Apercu : alimente le graphique, l'activite recente et le total
  const { data: apercu } = useColis({ page: 1, parPage: TAILLE_APERCU });

  // Total de colis livres : une requete d'une ligne suffit, on ne lit que `total`
  const { data: livres } = useColis({ statut: "LIVRE", page: 1, parPage: 1 });

  // Les 5 colis du tableau, filtres cote serveur
  const { data: recents, isPending: recentsPending } = useColis({
    statut: (activeFilter || undefined) as StatutColis | undefined,
    page: 1,
    parPage: 5,
  });

  const { data: transactions } = useTransactions(1, 5);

  const totalColis = apercu?.total ?? 0;
  const totalLivres = livres?.total ?? 0;

  // -- Donnees du graphique : 14 derniers jours --
  const chartData = useMemo(() => {
    // Cle stable AAAA-MM-JJ, insensible au format d'affichage
    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    // On compte une seule fois, en O(n) au lieu de 14 filtres
    const parJour = new Map<string, number>();
    (apercu?.elements ?? []).forEach((c) => {
      const d = new Date(c.createdAt);
      if (isNaN(d.getTime())) return;
      parJour.set(dayKey(d), (parJour.get(dayKey(d)) ?? 0) + 1);
    });

    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (13 - i));
      const jour = i === 13 ? "Auj."
        : i === 0 ? `${d.getDate()} ${MOIS[d.getMonth()]}`
        : String(d.getDate());
      return { jour, colis: parJour.get(dayKey(d)) ?? 0 };
    });
  }, [apercu]);

  // -- Activite recente : fusion colis + transactions triee par date --
  const recentActivity = useMemo(() => {
    const items = [
      ...(apercu?.elements ?? []).slice(0, 5).map((c) => ({
        key: `colis-${c.id}`,
        tracking: c.tracking,
        action: `cree, de ${c.origine.ville} vers ${c.destination.ville}`,
        iso: c.createdAt,
        dotColor: C.emerald,
      })),
      ...(transactions?.elements ?? []).slice(0, 5).map((tx) => ({
        key: `tx-${tx.id}`,
        tracking: "",
        action: tx.description ?? tx.type,
        iso: tx.createdAt,
        dotColor: tx.type === "RECHARGE" ? C.bronze : C.taupe,
      })),
    ];
    return items
      .sort((a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime())
      .slice(0, 5);
  }, [apercu, transactions]);

  const livresPercent = totalColis === 0 ? 0 : Math.round((totalLivres / totalColis) * 100);

  return (
    <div
      className="px-4 py-5 md:px-8 md:py-7 mx-auto"
      style={{ maxWidth: "1400px", width: "100%", minWidth: 0 }}
    >
      {/* -- Section KPIs (3 cartes en haut) -- */}
      <section aria-label="Indicateurs cles">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-7">
          <KpiCard
            label="Solde du compte"
            value={profil ? profil.soldeCompte.toLocaleString("fr") : "—"}
            unit="XOF"
            trendLabel="Mis a jour en temps reel"
            featured
          />
          <KpiCard
            label="Colis enregistres"
            value={totalColis.toString()}
            trendLabel={totalColis > 0 ? `${totalColis} colis au total` : "Aucun colis pour l'instant"}
          />
          <KpiCard
            label="Colis livres"
            value={livresPercent.toString()}
            unit="%"
            trendLabel={`${totalLivres} colis livres`}
          />
        </div>
      </section>

      {/* -- Grille : graphique + activite recente -- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5 mb-6 md:mb-7">
        {/* Graphique des 14 derniers jours */}
        <section
          aria-label="Graphique"
          className="lg:col-span-3 rounded-2xl"
          style={{
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            padding: "22px",
            minWidth: 0,
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: C.anthracite }}>
              Activite des 14 derniers jours
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="4 4" stroke={C.border} vertical={false} />
              <XAxis dataKey="jour" tick={{ fill: C.taupe, fontSize: 10, fontFamily: "Manrope" }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fill: C.taupe, fontSize: 10, fontFamily: "Manrope" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: C.emeraldSoft }} />
              <Bar dataKey="colis" fill={C.emerald} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Activite recente : mix colis + transactions */}
        <section
          aria-label="Activite recente"
          className="lg:col-span-2 rounded-2xl"
          style={{
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            padding: "22px",
            minWidth: 0,
          }}
        >
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: C.anthracite, marginBottom: "16px" }}>
            Activite recente
          </h2>
          {recentActivity.length === 0 ? (
            <p style={{ fontSize: "12px", color: C.taupeLight, textAlign: "center", padding: "20px 0" }}>
              Aucune activite pour l'instant.
            </p>
          ) : recentActivity.map((item) => (
            <div key={item.key} className="flex items-start gap-3 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <span
                className="rounded-full shrink-0 mt-1.5"
                style={{ width: "7px", height: "7px", backgroundColor: item.dotColor }}
              />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: "12.5px", color: C.anthracite, lineHeight: 1.5, overflowWrap: "break-word" }}>
                  {item.tracking && (
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "11px", color: C.emerald, marginRight: "6px" }}>
                      {item.tracking}
                    </span>
                  )}
                  {item.action}
                </p>
                <p style={{ fontSize: "10px", color: C.taupeLight, marginTop: "3px" }}>{formatDateFr(item.iso)}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* -- Tableau des colis recents avec filtre -- */}
      <section aria-label="Colis recents">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: C.anthracite, marginBottom: "12px" }}>
              Colis recents
            </h2>
            {/* Sur telephone : dropdown natif. Sur desktop : pilules horizontales. */}
            <FilterTabs
              options={FILTER_OPTIONS}
              value={activeFilter}
              onChange={setActiveFilter}
              ariaLabel="Filtrer les colis par statut"
            />
          </div>

          {/* scroll-x-contain isole le scroll horizontal (ne pousse pas la page) */}
          <div className="scroll-x-contain">
            <table className="w-full" style={{ minWidth: "640px" }}>
              <thead>
                <tr style={{ backgroundColor: C.sage }}>
                  {["Tracking", "Trajet", "Destinataire", "Statut", "Montant"].map((h) => (
                    <th
                      key={h}
                      className="text-left"
                      style={{
                        fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: 700,
                        color: C.taupe, letterSpacing: "1.5px", textTransform: "uppercase",
                        padding: "10px 20px",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                  <th style={{ width: "44px" }}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentsPending ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: C.taupe }}>
                      Chargement...
                    </td>
                  </tr>
                ) : (recents?.elements.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: C.taupe }}>
                      Aucun colis avec ce filtre.
                    </td>
                  </tr>
                ) : recents!.elements.map((item, idx) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedColis(item)}
                    className="transition-colors duration-150 cursor-pointer"
                    style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: idx % 2 === 0 ? "transparent" : C.ivory }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.sage)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : C.ivory)}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: C.emerald }}>
                        {item.tracking}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: C.anthracite }}>
                      <strong>{item.origine.ville}</strong>
                      <span style={{ color: C.bronze, margin: "0 8px" }}>{"→"}</span>
                      <strong>{item.destination.ville}</strong>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: C.taupe }}>{item.destinataireNom}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <StatutBadge statut={item.statut} />
                    </td>
                    <td style={{ padding: "14px 20px", fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: C.anthracite }}>
                      {item.montant.toLocaleString("fr")}
                      <span style={{ color: C.taupe, fontSize: "11px", fontWeight: 400 }}> XOF</span>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <button
                        type="button"
                        aria-label={`Ouvrir le detail de ${item.tracking}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedColis(item); }}
                        className="flex items-center justify-center rounded-lg"
                        style={{
                          background: "none", border: "none", color: C.taupeLight,
                          cursor: "pointer", minWidth: "32px", minHeight: "32px",
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${C.border}`, fontSize: "12px", color: C.taupe }}>
            <span>{recents?.elements.length ?? 0} colis affiches sur {recents?.total ?? 0}</span>
          </div>
        </div>
      </section>

      {/* Fiche detaillee, identique a celle de la page "Mes colis" */}
      {selectedColis && (
        <ColisDetailPanel colis={selectedColis} onClose={() => setSelectedColis(null)} />
      )}

      <div className="h-8" />
    </div>
  );
}
