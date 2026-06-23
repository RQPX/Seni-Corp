import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, PlusCircle, CreditCard, FileText,
  Settings, HelpCircle, Search, Bell, Menu, X, TrendingUp,
  MapPin, Clock, CheckCircle2, Truck, ChevronRight, LogOut,
  ArrowUpRight, ArrowDownRight, Eye, Filter
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

// ============================================================
// SENI CORP — Tableau de bord commerçant
// Palette : Emeraude / Bronze / Ivoire
// Polices : Manrope (titres), Inter (corps), JetBrains Mono (codes)
// ============================================================

// -- Palette officielle SENI CORP --
// Chaque couleur a un role precis dans l'interface
const C = {
  emerald:      "#0B4D3F",   // couleur principale, sidebar, boutons primaires
  emeraldDark:  "#083528",   // hover sur emeraude
  emeraldLight: "#1A6B58",   // variante plus claire pour accents
  emeraldSoft:  "#E8F0ED",   // fond subtil emeraude (badges, highlights)
  bronze:       "#B8935A",   // couleur secondaire, accents precieux
  bronzeLight:  "#D4B486",   // variante claire du bronze
  bronzeSoft:   "#F5EFE3",   // fond subtil bronze
  ivory:        "#FAF6F0",   // fond principal de l'application
  sage:         "#E8EDE5",   // surfaces secondaires (cartes, zones)
  anthracite:   "#1A1A1A",   // texte principal
  taupe:        "#6B6259",   // texte secondaire, legendes
  taupeLight:   "#9B8A7E",   // texte tertiaire, placeholders
  terra:        "#C66D4F",   // alertes, points d'attention
  terraSoft:    "#FCEEE9",   // fond subtil terre cuite
  border:       "#EAE3D5",   // bordures legeres
  borderStrong: "#D9D2C5",   // bordures appuyees
  success:      "#4A6B5C",   // succes, livraison confirmee
  white:        "#FFFFFF",
};

// -- Elements de navigation de la sidebar --
// Chaque item a une icone Lucide, un label et un identifiant
const NAV_ITEMS = [
  { id: "dashboard",  label: "Tableau de bord",  icon: LayoutDashboard, section: "Pilotage" },
  { id: "colis",      label: "Mes colis",         icon: Package,         section: "Pilotage" },
  { id: "nouveau",    label: "Nouveau colis",     icon: PlusCircle,      section: "Pilotage" },
  { id: "paiements",  label: "Paiements",         icon: CreditCard,      section: "Finance" },
  { id: "factures",   label: "Factures",           icon: FileText,        section: "Finance" },
  { id: "parametres", label: "Parametres",         icon: Settings,        section: "Compte" },
  { id: "aide",       label: "Aide",               icon: HelpCircle,      section: "Compte" },
];

// -- Donnees de demonstration --
// Ces donnees seront remplacees par des appels API en production

const CHART_DATA = [
  { jour: "14 avr", colis: 18 },
  { jour: "15",     colis: 22 },
  { jour: "16",     colis: 19 },
  { jour: "17",     colis: 28 },
  { jour: "18",     colis: 24 },
  { jour: "19",     colis: 31 },
  { jour: "20",     colis: 27 },
  { jour: "21",     colis: 34 },
  { jour: "22",     colis: 38 },
  { jour: "23",     colis: 32 },
  { jour: "24",     colis: 41 },
  { jour: "25",     colis: 36 },
  { jour: "26",     colis: 45 },
  { jour: "27 avr", colis: 42 },
];

const RECENT_ACTIVITY = [
  { id: 1, tracking: "SC-2026-A8K4M2", action: "livre a Korhogo",              temps: "il y a 12 min",  type: "success" },
  { id: 2, tracking: "SC-2026-B2F7N9", action: "arrive au relais Bouake",      temps: "il y a 45 min",  type: "info" },
  { id: 3, tracking: "",                action: "Recharge +50 000 XOF via Wave", temps: "il y a 1 h",     type: "payment" },
  { id: 4, tracking: "SC-2026-C5R3X1", action: "en transit vers Yamoussoukro", temps: "il y a 2 h",     type: "transit" },
];

const COLIS_DATA = [
  { tracking: "SC-2026-A8K4M2", origine: "Abidjan",  destination: "Korhogo",      destinataire: "Fatou Diallo",    statut: "livre",    montant: "3 200" },
  { tracking: "SC-2026-B2F7N9", origine: "Abidjan",  destination: "Bouake",       destinataire: "Mamadou Toure",   statut: "relais",   montant: "2 100" },
  { tracking: "SC-2026-C5R3X1", origine: "Abidjan",  destination: "Yamoussoukro", destinataire: "Adjoua Kouassi",  statut: "transit",  montant: "1 800" },
  { tracking: "SC-2026-D9P2L8", origine: "Abidjan",  destination: "San-Pedro",    destinataire: "Aminata Bamba",   statut: "cree",     montant: "2 500" },
  { tracking: "SC-2026-E4Q8M3", origine: "Korhogo",  destination: "Abidjan",      destinataire: "Jean-Luc Assi",   statut: "transit",  montant: "1 950" },
];

// -- Correspondance statut -> apparence du badge --
// Chaque statut a sa couleur de fond et de texte
const STATUS_CONFIG = {
  livre:   { label: "Livre",      bg: C.emeraldSoft, color: C.emerald,    icon: CheckCircle2 },
  relais:  { label: "Au relais",  bg: C.emeraldSoft, color: C.emeraldLight, icon: MapPin },
  transit: { label: "En transit", bg: C.bronzeSoft,   color: C.bronze,     icon: Truck },
  cree:    { label: "Cree",       bg: C.sage,         color: C.taupe,      icon: Clock },
};


// ============================================================
// COMPOSANTS
// ============================================================

// -- Sidebar --
// Navigation principale, fixe sur desktop, tiroir sur mobile
// Le parametre "open" controle la visibilite sur mobile
function Sidebar({ currentPage, onNavigate, open, onClose }) {
  // On regroupe les items par section pour structurer le menu
  let lastSection = "";

  return (
    <>
      {/* Fond assombri derriere la sidebar sur mobile */}
      {open && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        />
      )}

      <nav
        role="navigation"
        aria-label="Menu principal"
        className={`
          fixed top-0 left-0 z-50 h-full flex flex-col
          transition-transform duration-300 ease-out
          md:translate-x-0 md:relative md:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          width: "256px",
          backgroundColor: C.emerald,
          color: C.ivory,
        }}
      >
        {/* En-tete avec logo et bouton fermer (mobile) */}
        <div className="flex items-center justify-between px-5 pt-6 pb-2">
          <div>
            <div style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "3px",
              color: C.white,
            }}>
              SENI CORP
            </div>
            <div style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "9px",
              letterSpacing: "2px",
              color: C.bronzeLight,
              textTransform: "uppercase",
              marginTop: "2px",
            }}>
              Logistique
            </div>
          </div>

          {/* Bouton fermer visible uniquement sur mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-md"
            aria-label="Fermer le menu"
            style={{ color: C.bronzeLight }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Liste des liens de navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            // On affiche le label de section quand il change
            const showSection = item.section !== lastSection;
            if (showSection) lastSection = item.section;
            const isActive = currentPage === item.id;
            const Icon = item.icon;

            return (
              <div key={item.id}>
                {/* Label de section (Pilotage, Finance, etc.) */}
                {showSection && (
                  <div style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: "9px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: C.bronzeLight,
                    opacity: 0.6,
                    padding: "16px 12px 6px",
                  }}>
                    {item.section}
                  </div>
                )}

                {/* Bouton de navigation */}
                <button
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150"
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    backgroundColor: isActive ? "rgba(184, 147, 90, 0.18)" : "transparent",
                    color: isActive ? C.white : "rgba(250, 246, 240, 0.72)",
                    fontWeight: isActive ? 500 : 400,
                    fontSize: "13.5px",
                    borderLeft: isActive ? `3px solid ${C.bronze}` : "3px solid transparent",
                  }}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bloc utilisateur en bas de la sidebar */}
        <div className="px-3 pb-5">
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
          >
            {/* Avatar avec initiales */}
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{
                width: "36px", height: "36px",
                background: `linear-gradient(135deg, ${C.bronze}, ${C.bronzeLight})`,
                fontFamily: "'Manrope', sans-serif",
                fontSize: "13px", fontWeight: 700,
                color: C.emeraldDark,
              }}
            >
              AK
            </div>

            <div className="flex-1 min-w-0">
              <div style={{ fontSize: "13px", fontWeight: 600, color: C.white }}>
                Aicha Kone
              </div>
              <div style={{ fontSize: "10px", color: "rgba(250, 246, 240, 0.6)" }}>
                Mode Adjame
              </div>
            </div>

            <button aria-label="Deconnexion" style={{ color: "rgba(250, 246, 240, 0.4)" }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}


// -- Barre superieure --
// Affiche le titre de la page, la recherche, les notifications
// et le bouton d'action principal
function TopBar({ onMenuOpen }) {
  return (
    <header
      className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4"
      style={{
        backgroundColor: C.white,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {/* Partie gauche : hamburger (mobile) + titre */}
      <div className="flex items-center gap-3">
        {/* Hamburger visible uniquement sur mobile */}
        <button
          onClick={onMenuOpen}
          className="md:hidden p-2 -ml-2 rounded-lg"
          aria-label="Ouvrir le menu"
          style={{ color: C.emerald }}
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "18px",
            fontWeight: 600,
            color: C.anthracite,
          }}>
            Bonjour, Aicha
          </h1>
          <p style={{ fontSize: "12px", color: C.taupe, marginTop: "2px" }}>
            Lundi 27 avril 2026
          </p>
        </div>
      </div>

      {/* Partie droite : recherche, notifications, action */}
      <div className="flex items-center gap-2">
        {/* Bouton recherche */}
        <button
          className="hidden sm:flex items-center justify-center rounded-lg"
          aria-label="Rechercher un colis"
          style={{
            width: "38px", height: "38px",
            backgroundColor: C.sage,
            border: `1px solid ${C.border}`,
            color: C.emerald,
          }}
        >
          <Search size={17} strokeWidth={1.8} />
        </button>

        {/* Bouton notifications avec pastille */}
        <button
          className="relative flex items-center justify-center rounded-lg"
          aria-label="Notifications (2 nouvelles)"
          style={{
            width: "38px", height: "38px",
            backgroundColor: C.sage,
            border: `1px solid ${C.border}`,
            color: C.emerald,
          }}
        >
          <Bell size={17} strokeWidth={1.8} />
          {/* Pastille rouge pour signaler des notifications */}
          <span
            className="absolute rounded-full"
            style={{
              top: "8px", right: "8px",
              width: "8px", height: "8px",
              backgroundColor: C.terra,
              border: `2px solid ${C.sage}`,
            }}
          />
        </button>

        {/* Bouton principal : creer un colis */}
        <button
          className="hidden sm:flex items-center gap-2 rounded-lg transition-colors"
          style={{
            backgroundColor: C.emerald,
            color: C.ivory,
            padding: "9px 16px",
            fontFamily: "'Manrope', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          <PlusCircle size={15} strokeWidth={2} />
          Nouveau colis
        </button>
      </div>
    </header>
  );
}


// -- Carte KPI --
// Affiche un indicateur cle avec sa tendance (hausse ou baisse)
function KpiCard({ label, value, unit, trend, trendLabel, featured }) {
  // La version "featured" (mise en avant) utilise le fond emeraude
  const isUp = trend > 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        backgroundColor: featured ? C.emerald : C.white,
        border: featured ? "none" : `1px solid ${C.border}`,
        padding: "22px",
      }}
    >
      {/* Halo decoratif sur la carte mise en avant */}
      {featured && (
        <div
          className="absolute"
          style={{
            top: "-20px", right: "-20px",
            width: "100px", height: "100px",
            background: `radial-gradient(circle, ${C.bronze} 0%, transparent 70%)`,
            opacity: 0.35,
          }}
        />
      )}

      {/* Label du KPI */}
      <div style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: featured ? C.bronzeLight : C.taupe,
        marginBottom: "12px",
      }}>
        {label}
      </div>

      {/* Valeur principale */}
      <div className="flex items-baseline gap-1.5">
        <span style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: "30px",
          fontWeight: 700,
          color: featured ? C.white : C.anthracite,
          lineHeight: 1,
        }}>
          {value}
        </span>
        {unit && (
          <span style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: featured ? C.bronzeLight : C.taupe,
          }}>
            {unit}
          </span>
        )}
      </div>

      {/* Indicateur de tendance */}
      <div
        className="flex items-center gap-1 mt-2.5"
        style={{
          fontSize: "11px",
          fontWeight: 500,
          color: featured ? C.bronzeLight : (isUp ? C.success : C.terra),
        }}
      >
        {isUp
          ? <ArrowUpRight size={13} strokeWidth={2.5} />
          : <ArrowDownRight size={13} strokeWidth={2.5} />
        }
        {trendLabel}
      </div>
    </div>
  );
}


// -- Badge de statut --
// Affiche le statut d'un colis avec couleur et icone adaptes
function StatusBadge({ statut }) {
  const config = STATUS_CONFIG[statut];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: "4px 10px",
        fontFamily: "'Manrope', sans-serif",
        fontSize: "10px",
        fontWeight: 600,
      }}
    >
      <Icon size={11} strokeWidth={2} />
      {config.label}
    </span>
  );
}


// -- Tooltip personnalise pour le graphique --
// S'affiche au survol d'une barre du graphique
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg shadow-lg"
      style={{
        backgroundColor: C.emerald,
        padding: "10px 14px",
        border: "none",
      }}
    >
      <div style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: "10px",
        color: C.bronzeLight,
        letterSpacing: "1px",
        textTransform: "uppercase",
        marginBottom: "4px",
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: "18px",
        fontWeight: 700,
        color: C.white,
      }}>
        {payload[0].value} colis
      </div>
    </div>
  );
}


// ============================================================
// PAGE PRINCIPALE — TABLEAU DE BORD
// ============================================================
export default function Dashboard() {
  // Etat de la sidebar sur mobile (ouverte ou fermee)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Fermer la sidebar si on passe en mode desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: C.ivory }}>

      {/* Chargement des polices depuis Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; }

        /* Focus visible pour l'accessibilite clavier */
        :focus-visible {
          outline: 2px solid ${C.bronze};
          outline-offset: 2px;
        }

        /* Scrollbar personnalisee pour rester dans la charte */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.ivory}; }
        ::-webkit-scrollbar-thumb { background: ${C.borderStrong}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.taupe}; }
      `}</style>

      {/* Sidebar de navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Barre superieure */}
        <TopBar onMenuOpen={() => setSidebarOpen(true)} />

        {/* Zone de contenu scrollable */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: C.ivory }}
        >
          <div className="px-4 py-5 md:px-8 md:py-7 max-w-[1400px] mx-auto">

            {/* ---- CARTES KPI ---- */}
            {/* 3 colonnes sur desktop, 1 sur mobile */}
            <section aria-label="Indicateurs cles">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-7">
                <KpiCard
                  label="Solde du compte"
                  value="87 500"
                  unit="XOF"
                  trend={1}
                  trendLabel="+25 000 cette semaine"
                  featured={true}
                />
                <KpiCard
                  label="Colis ce mois"
                  value="234"
                  trend={1}
                  trendLabel="+18% vs mars"
                />
                <KpiCard
                  label="Livres a temps"
                  value="96"
                  unit="%"
                  trend={1}
                  trendLabel="+4 pts"
                />
              </div>
            </section>

            {/* ---- GRAPHIQUE + ACTIVITE ---- */}
            {/* 2 colonnes sur desktop, empile sur mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5 mb-6 md:mb-7">

              {/* Graphique d'evolution (prend 3/5 de l'espace) */}
              <section
                aria-label="Graphique d'activite"
                className="lg:col-span-3 rounded-2xl"
                style={{
                  backgroundColor: C.white,
                  border: `1px solid ${C.border}`,
                  padding: "22px",
                }}
              >
                {/* En-tete du panneau */}
                <div className="flex items-center justify-between mb-5">
                  <h2 style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: C.anthracite,
                  }}>
                    Activite des 14 derniers jours
                  </h2>
                  <button style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: C.emerald,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}>
                    Voir tout
                  </button>
                </div>

                {/* Graphique recharts */}
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={CHART_DATA} barCategoryGap="25%">
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={C.border}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="jour"
                      tick={{ fill: C.taupe, fontSize: 10, fontFamily: "Manrope" }}
                      axisLine={{ stroke: C.border }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: C.taupe, fontSize: 10, fontFamily: "Manrope" }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: C.emeraldSoft }}
                    />
                    <Bar
                      dataKey="colis"
                      fill={C.emerald}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </section>

              {/* Fil d'activite recente (prend 2/5 de l'espace) */}
              <section
                aria-label="Activite recente"
                className="lg:col-span-2 rounded-2xl"
                style={{
                  backgroundColor: C.white,
                  border: `1px solid ${C.border}`,
                  padding: "22px",
                }}
              >
                <h2 style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: C.anthracite,
                  marginBottom: "16px",
                }}>
                  Activite recente
                </h2>

                <div className="space-y-1">
                  {RECENT_ACTIVITY.map((item) => {
                    // Couleur du point selon le type d'evenement
                    const dotColor = item.type === "success" ? C.success
                      : item.type === "payment" ? C.bronze
                      : item.type === "transit" ? C.emeraldLight
                      : C.emerald;

                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 py-3"
                        style={{ borderBottom: `1px solid ${C.border}` }}
                      >
                        {/* Pastille de couleur */}
                        <span
                          className="rounded-full shrink-0 mt-1.5"
                          style={{
                            width: "7px",
                            height: "7px",
                            backgroundColor: dotColor,
                          }}
                        />

                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: "12.5px", color: C.anthracite, lineHeight: 1.5 }}>
                            {/* Tracking number en gras si present */}
                            {item.tracking && (
                              <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 600,
                                fontSize: "11px",
                                color: C.emerald,
                                marginRight: "6px",
                              }}>
                                {item.tracking}
                              </span>
                            )}
                            {item.action}
                          </p>
                          <p style={{ fontSize: "10px", color: C.taupeLight, marginTop: "3px" }}>
                            {item.temps}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* ---- TABLEAU DES COLIS RECENTS ---- */}
            <section aria-label="Colis recents">
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: C.white,
                  border: `1px solid ${C.border}`,
                }}
              >
                {/* En-tete du tableau */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: `1px solid ${C.border}` }}
                >
                  <h2 style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: C.anthracite,
                  }}>
                    Colis recents
                  </h2>

                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-1.5 rounded-lg"
                      aria-label="Filtrer les colis"
                      style={{
                        fontSize: "12px",
                        color: C.taupe,
                        padding: "7px 12px",
                        backgroundColor: C.sage,
                        border: `1px solid ${C.border}`,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <Filter size={13} strokeWidth={2} />
                      Filtrer
                    </button>
                    <button style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: C.emerald,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}>
                      Voir tout
                    </button>
                  </div>
                </div>

                {/* Tableau avec scroll horizontal sur mobile */}
                <div className="overflow-x-auto">
                  <table
                    className="w-full"
                    style={{ minWidth: "640px" }}
                    role="table"
                  >
                    {/* En-tete du tableau */}
                    <thead>
                      <tr style={{ backgroundColor: C.sage }}>
                        {["Tracking", "Trajet", "Destinataire", "Statut", "Montant"].map((col) => (
                          <th
                            key={col}
                            className="text-left"
                            style={{
                              fontFamily: "'Manrope', sans-serif",
                              fontSize: "10px",
                              fontWeight: 700,
                              color: C.taupe,
                              letterSpacing: "1.5px",
                              textTransform: "uppercase",
                              padding: "10px 20px",
                            }}
                          >
                            {col}
                          </th>
                        ))}
                        {/* Colonne pour l'action */}
                        <th style={{ width: "44px", padding: "10px 12px" }}>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>

                    {/* Corps du tableau */}
                    <tbody>
                      {COLIS_DATA.map((colis, idx) => (
                        <tr
                          key={colis.tracking}
                          className="transition-colors duration-150"
                          style={{
                            borderBottom: `1px solid ${C.border}`,
                            backgroundColor: idx % 2 === 0 ? "transparent" : C.ivory,
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.sage}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : C.ivory}
                          role="row"
                          tabIndex={0}
                          aria-label={`Colis ${colis.tracking}, ${colis.origine} vers ${colis.destination}`}
                        >
                          {/* Numero de tracking */}
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: C.emerald,
                            }}>
                              {colis.tracking}
                            </span>
                          </td>

                          {/* Trajet : origine -> destination */}
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{ fontSize: "13px", color: C.anthracite }}>
                              <strong>{colis.origine}</strong>
                              <span style={{ color: C.bronze, margin: "0 8px" }}>
                                {"\u2192"}
                              </span>
                              <strong>{colis.destination}</strong>
                            </span>
                          </td>

                          {/* Destinataire */}
                          <td style={{
                            padding: "14px 20px",
                            fontSize: "13px",
                            color: C.taupe,
                          }}>
                            {colis.destinataire}
                          </td>

                          {/* Badge statut */}
                          <td style={{ padding: "14px 20px" }}>
                            <StatusBadge statut={colis.statut} />
                          </td>

                          {/* Montant */}
                          <td style={{
                            padding: "14px 20px",
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: C.anthracite,
                          }}>
                            {colis.montant} <span style={{ color: C.taupe, fontWeight: 400, fontSize: "11px" }}>XOF</span>
                          </td>

                          {/* Bouton voir le detail */}
                          <td style={{ padding: "14px 12px" }}>
                            <button
                              aria-label={`Voir le detail du colis ${colis.tracking}`}
                              className="flex items-center justify-center rounded-lg transition-colors"
                              style={{
                                width: "32px",
                                height: "32px",
                                backgroundColor: "transparent",
                                border: "none",
                                color: C.taupeLight,
                                cursor: "pointer",
                              }}
                            >
                              <ChevronRight size={16} strokeWidth={2} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pied du tableau avec compteur */}
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    fontSize: "12px",
                    color: C.taupe,
                  }}
                >
                  <span>5 colis affiches sur 234</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-md"
                      style={{
                        padding: "5px 10px",
                        fontSize: "12px",
                        border: `1px solid ${C.border}`,
                        backgroundColor: C.white,
                        color: C.taupe,
                        cursor: "pointer",
                      }}
                    >
                      Precedent
                    </button>
                    <button
                      className="rounded-md"
                      style={{
                        padding: "5px 10px",
                        fontSize: "12px",
                        border: `1px solid ${C.emerald}`,
                        backgroundColor: C.emerald,
                        color: C.ivory,
                        cursor: "pointer",
                      }}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Espacement en bas de page */}
            <div className="h-8" />
          </div>
        </main>
      </div>
    </div>
  );
}
