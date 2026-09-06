// ============================================================
// SENI CORP — Page Tableau de bord
// Page d'accueil du commercant apres connexion.
// Affiche : solde, nombre de colis, activite recente, graphique,
// et la liste des colis recents filtrable.
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import {
  ArrowUpRight, CheckCircle2, MapPin, Truck, Clock,
  ChevronRight, AlertTriangle, XCircle, RotateCcw
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { statutConfig } from "@/lib/statuts";
import { formatDateFr } from "@/lib/utils";

// Palette de la marque
const C = {
  emerald: "#0B4D3F", emeraldLight: "#1A6B58", emeraldSoft: "#E8F0ED",
  bronze: "#B8935A", bronzeLight: "#D4B486", bronzeSoft: "#F5EFE3",
  ivory: "#FAF6F0", sage: "#E8EDE5", anthracite: "#1A1A1A",
  taupe: "#6B6259", taupeLight: "#9B8A7E", terra: "#C66D4F",
  border: "#EAE3D5", success: "#4A6B5C", white: "#FFFFFF",
};

// Mois en francais pour le graphique
const MOIS = ["jan","fev","mar","avr","mai","jun","jul","aou","sep","oct","nov","dec"];

// Icone de chaque statut (couleurs et libelle lus depuis statutConfig)
const STATUT_ICONS: Record<string, typeof Clock> = {
  livre:      CheckCircle2,
  attente:    MapPin,
  transit:    Truck,
  cree:       Clock,
  retarde:    AlertTriangle,
  annule:     XCircle,
  retourne:   RotateCcw,
};

// Options du filtre affichees en haut du tableau
const FILTER_OPTIONS = [
  { value: "tous",    label: "Tous" },
  { value: "livre",   label: "Livres" },
  { value: "attente", label: "En attente retrait" },
  { value: "transit", label: "En transit" },
  { value: "cree",    label: "Crees" },
];

// -- Petit badge colore selon le statut --
function StatusBadge({ statut }: { statut: string }) {
  const config = statutConfig(statut);
  const Icon = STATUT_ICONS[statut];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: "4px 10px",
        fontFamily: "var(--font-heading)",
        fontSize: "10px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {Icon && <Icon size={11} strokeWidth={2} />}
      {config.label}
    </span>
  );
}

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
          // Coupe les nombres trop grands
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
  // Lit les donnees depuis le store global (partage entre pages)
  const { colis, solde, transactions } = useAppStore();

  const [activeFilter, setActiveFilter] = useState("tous");

  // -- Colis filtres, limites aux 5 plus recents --
  const filteredColis = useMemo(() => {
    const base = activeFilter === "tous"
      ? colis
      : colis.filter((c) => c.statut === activeFilter);
    return base.slice(0, 5);
  }, [activeFilter, colis]);

  // -- Donnees du graphique : 14 derniers jours --
  const chartData = useMemo(() => {
    // Cle stable AAAA-MM-JJ, insensible au format d'affichage
    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    // On compte une seule fois, en O(n) au lieu de 14 filtres
    const parJour = new Map<string, number>();
    colis.forEach((c) => {
      const d = new Date(c.createdAt);
      if (isNaN(d.getTime())) return;          // date invalide : on ignore
      const k = dayKey(d);
      parJour.set(k, (parJour.get(k) ?? 0) + 1);
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
  }, [colis]);

  // -- Activite recente : fusion colis + transactions triee par date --
  const recentActivity = useMemo(() => {
    // Accepte "27/04/2026" et "27/04/2026 10:15"
    const parseDate = (s: string) => {
      const [datePart, timePart] = String(s).trim().split(" ");
      const [d, m, y] = datePart.split("/").map(Number);
      const [hh = 0, mn = 0] = (timePart ?? "").split(":").map(Number);
      const t = new Date(y, m - 1, d, hh, mn).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    const items = [
      ...colis.slice(0, 5).map((c) => ({
        key: c.tracking, tracking: c.tracking,
        action: `cree — ${c.origine} vers ${c.destination}`,
        date: formatDateFr(c.createdAt), dotColor: C.emerald,
      })),
      ...transactions.slice(0, 5).map((tx) => ({
        key: String(tx.id), tracking: "",
        action: tx.desc,
        date: tx.date, dotColor: tx.montant > 0 ? C.bronze : C.taupe,
      })),
    ];
    return items.sort((a, b) => parseDate(b.date) - parseDate(a.date)).slice(0, 5);
  }, [colis, transactions]);

  // -- Pourcentage de colis livres --
  const livresPercent = useMemo(() => {
    if (colis.length === 0) return 100;
    const livres = colis.filter((c) => c.statut === "livre").length;
    return Math.round((livres / colis.length) * 100);
  }, [colis]);

  return (
    <div
      className="px-4 py-5 md:px-8 md:py-7 mx-auto"
      style={{
        maxWidth: "1400px",
        width: "100%",
        // Empeche tout debordement horizontal (garde le contenu dans le viewport)
        minWidth: 0,
      }}
    >
      {/* -- Section KPIs (3 cartes en haut) -- */}
      <section aria-label="Indicateurs cles">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-7">
          <KpiCard
            label="Solde du compte"
            value={solde.toLocaleString("fr")}
            unit="XOF"
            trendLabel="Mis a jour en temps reel"
            featured
          />
          <KpiCard
            label="Colis enregistres"
            value={colis.length.toString()}
            trendLabel={colis.length > 0 ? `${colis.length} colis au total` : "Aucun colis pour l'instant"}
          />
          <KpiCard
            label="Livres a temps"
            value={livresPercent.toString()}
            unit="%"
            trendLabel={`${colis.filter(c => c.statut === "livre").length} colis livres`}
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
            minWidth: 0, // empeche le graphique de sortir de la carte
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
              <YAxis tick={{ fill: C.taupe, fontSize: 10, fontFamily: "Manrope" }} axisLine={false} tickLine={false} width={30} />
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
                <p style={{ fontSize: "10px", color: C.taupeLight, marginTop: "3px" }}>{item.date}</p>
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
            {/* -- FIX DROPDOWN MOBILE -- */}
            {/* Sur telephone : dropdown natif (facile a manipuler au doigt) */}
            {/* Sur desktop : pilules horizontales classiques */}
            <FilterTabs
              options={FILTER_OPTIONS}
              value={activeFilter}
              onChange={setActiveFilter}
              ariaLabel="Filtrer les colis par statut"
            />
          </div>

          {/* -- Tableau des colis -- */}
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
                {filteredColis.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: C.taupe }}>
                      Aucun colis avec ce filtre.
                    </td>
                  </tr>
                ) : filteredColis.map((item, idx) => (
                  <tr
                    key={item.tracking}
                    className="transition-colors duration-150 cursor-pointer"
                    style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: idx % 2 === 0 ? "transparent" : C.ivory }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.sage}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : C.ivory}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: C.emerald }}>
                        {item.tracking}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: C.anthracite }}>
                      <strong>{item.origine}</strong>
                      <span style={{ color: C.bronze, margin: "0 8px" }}>{"\u2192"}</span>
                      <strong>{item.destination}</strong>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: C.taupe }}>{item.destinataire}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <StatusBadge statut={item.statut} />
                    </td>
                    <td style={{ padding: "14px 20px", fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: C.anthracite }}>
                      {item.montant.toLocaleString("fr")}
                      <span style={{ color: C.taupe, fontSize: "11px", fontWeight: 400 }}> XOF</span>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <button
                        aria-label={`Detail ${item.tracking}`}
                        style={{ background: "none", border: "none", color: C.taupeLight, cursor: "pointer" }}
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
            <span>{filteredColis.length} colis affiches sur {colis.length}</span>
          </div>
        </div>
      </section>

      <div className="h-8" />
    </div>
  );
}
