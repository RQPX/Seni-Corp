// ============================================================
// SENI CORP — Layout du Dashboard
// Ce fichier entoure toutes les pages de l'espace commercant.
// Il contient :
//   - La barre laterale (sidebar) avec le menu principal
//   - La barre du haut avec le titre, la recherche et les notifications
//   - La barre du bas (uniquement sur mobile) pour la navigation rapide
// Il regle aussi les problemes d'affichage sur les petits ecrans.
// ============================================================

"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  LayoutDashboard, Package, PlusCircle, CreditCard, FileText,
  Settings, HelpCircle, Menu, X, Bell, Search, LogOut
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { logout as apiLogout } from "@/lib/api";

// Palette de couleurs de la marque
const C = {
  emerald: "#0B4D3F", emeraldDark: "#083528", emeraldLight: "#1A6B58",
  emeraldSoft: "#E8F0ED", bronze: "#B8935A", bronzeLight: "#D4B486",
  ivory: "#FAF6F0", sage: "#E8EDE5", anthracite: "#1A1A1A",
  taupe: "#6B6259", taupeLight: "#9B8A7E", terra: "#C66D4F",
  border: "#EAE3D5", success: "#4A6B5C", white: "#FFFFFF",
};

// -- Menu principal --
// Chaque entree a un lien, une etiquette, une icone et une section (groupe)
const NAV_ITEMS = [
  { href: "/dashboard",           label: "Tableau de bord", icon: LayoutDashboard, section: "Pilotage" },
  { href: "/dashboard/colis",     label: "Mes colis",       icon: Package,         section: "Pilotage" },
  { href: "/dashboard/nouveau",   label: "Nouveau colis",   icon: PlusCircle,      section: "Pilotage" },
  { href: "/dashboard/paiements", label: "Paiements",       icon: CreditCard,      section: "Finance" },
  { href: "/dashboard/factures",  label: "Factures",        icon: FileText,        section: "Finance" },
  { href: "/dashboard/parametres",label: "Parametres",      icon: Settings,        section: "Compte" },
  { href: "/dashboard/aide",      label: "Aide",            icon: HelpCircle,      section: "Compte" },
];

// -- Notifications de demonstration --
// A remplacer par un vrai appel API plus tard
const NOTIFICATIONS = [
  { id: 1, text: "Colis SC-2026-A8K4M2 livre a Korhogo",           time: "il y a 12 min", read: false },
  { id: 2, text: "Colis SC-2026-B2F7N9 arrive au relais Bouake",   time: "il y a 45 min", read: false },
  { id: 3, text: "Recharge de 50 000 XOF confirmee via CinetPay",  time: "il y a 1 h",    read: true },
  { id: 4, text: "Facture mars 2026 disponible",                    time: "il y a 2 jours", read: true },
];


// ============================================================
// COMPOSANT SIDEBAR (barre laterale gauche)
// Sur desktop : toujours visible
// Sur mobile : cachee, s'ouvre en glissant depuis la gauche
// ============================================================
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Suivi de la derniere section pour afficher un titre de groupe une seule fois
  let lastSection = "";

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    // Invalide la session cote backend (efface le cookie httpOnly)
    await apiLogout();
    // replace() : empeche le retour arriere vers le dashboard
    router.replace("/login");
  };

  return (
    <>
      {/* -- Fond noir semi-transparent quand la sidebar est ouverte sur mobile -- */}
      {/* Cliquer dessus ferme la sidebar */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* -- Sidebar elle-meme -- */}
      {/* Mobile : fixed + translate-x (glisse depuis la gauche) */}
      {/* Desktop : position relative, toujours affichee (md:translate-x-0) */}
      <nav
        aria-label="Navigation principale"
        className={`fixed top-0 left-0 z-50 h-full flex flex-col transition-transform duration-300 ease-out md:relative md:translate-x-0 md:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: "256px",
          backgroundColor: C.emerald,
          // maxHeight avec dvh pour eviter les debordements sur iOS Safari
          maxHeight: "100dvh",
          // La sidebar est en position fixed : elle ignore le padding du body
          // (retire en C3), donc gere elle-meme l'encoche du haut sur iPhone
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        {/* -- En-tete de la sidebar : logo + bouton fermer (mobile) -- */}
        <div className="flex items-center justify-between px-5 pt-6 pb-2">
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 800, letterSpacing: "3px", color: C.white }}>
              SENI CORP
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "2px", color: C.bronzeLight, textTransform: "uppercase", marginTop: "2px" }}>
              Logistique
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-md"
            aria-label="Fermer le menu"
            style={{ color: C.bronzeLight, background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* -- Liste des liens du menu -- */}
        {/* overflow-y-auto : scrollable si la liste depasse en hauteur */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const showSection = item.section !== lastSection;
            if (showSection) lastSection = item.section;
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <div key={item.href}>
                {/* Titre de la section (Pilotage / Finance / Compte) */}
                {showSection && (
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: C.bronzeLight, opacity: 0.6, padding: "16px 12px 6px" }}>
                    {item.section}
                  </div>
                )}
                {/* Le lien lui-meme */}
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150"
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    backgroundColor: isActive ? "rgba(184, 147, 90, 0.18)" : "transparent",
                    color: isActive ? C.white : "rgba(250, 246, 240, 0.72)",
                    fontWeight: isActive ? 500 : 400,
                    fontSize: "13.5px",
                    borderLeft: isActive ? `3px solid ${C.bronze}` : "3px solid transparent",
                    textDecoration: "none",
                    minHeight: "40px",
                  }}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  {item.label}
                </Link>
              </div>
            );
          })}
        </div>

        {/* -- Bloc utilisateur en bas + bouton deconnexion -- */}
        <div className="px-3 pb-5">
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
            <div className="flex items-center justify-center rounded-full shrink-0" style={{
              width: "36px", height: "36px",
              background: `linear-gradient(135deg, ${C.bronze}, ${C.bronzeLight})`,
              fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 700, color: C.emeraldDark,
            }}>
              SN
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: "13px", fontWeight: 600, color: C.white }}>Seni N'Diaye</div>
              <div style={{ fontSize: "10px", color: "rgba(250, 246, 240, 0.6)" }}>Mode Adjame</div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              aria-label="Se deconnecter"
              style={{ color: "rgba(250, 246, 240, 0.4)", background: "none", border: "none", cursor: "pointer", minWidth: "44px", minHeight: "44px" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* -- Modale de confirmation de deconnexion -- */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="rounded-2xl" style={{ backgroundColor: C.white, padding: "28px", maxWidth: "380px", width: "100%" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.anthracite, marginBottom: "8px" }}>
                Se deconnecter ?
              </h3>
              <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "20px", lineHeight: 1.6 }}>
                Vous allez etre redirige vers la page de connexion.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 rounded-lg"
                  style={{ padding: "10px", border: `1px solid ${C.border}`, backgroundColor: C.white, color: C.taupe, fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer", minHeight: "44px" }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-lg"
                  style={{ padding: "10px", border: "none", backgroundColor: C.terra, color: C.white, fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer", minHeight: "44px" }}
                >
                  Deconnexion
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}


// ============================================================
// COMPOSANT TOPBAR (barre du haut)
// Contient le titre "Bonjour Seni", la recherche et les notifications
// Sur mobile, les notifs s'affichent en bottom sheet (feuille du bas)
// pour eviter les problemes de dropdown qui deborde
// ============================================================
function TopBar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // -- Ferme le panneau notifs si on clique en dehors --
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // -- Focus automatique sur le champ de recherche a l'ouverture --
  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  // -- Envoi de la recherche : redirige vers la liste des colis filtree --
  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/dashboard/colis?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header
      className="relative shrink-0"
      style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.border}` }}
    >
      <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4 gap-2">
        {/* -- Cote gauche : bouton menu (mobile) + titre du jour -- */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onMenuOpen}
            className="md:hidden p-2 -ml-2 rounded-lg shrink-0"
            aria-label="Ouvrir le menu"
            style={{ color: C.emerald, background: "none", border: "none", cursor: "pointer", minWidth: "44px", minHeight: "44px" }}
          >
            <Menu size={22} />
          </button>
          <div className="min-w-0">
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 600, color: C.anthracite, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              BONJOUR SENI
            </h1>
            <p style={{ fontSize: "12px", color: C.taupe, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* -- Cote droit : recherche + notifs + bouton "Nouveau colis" -- */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Bouton recherche */}
          <button
            onClick={() => { setSearchOpen(!searchOpen); setNotifOpen(false); }}
            className="flex items-center justify-center rounded-lg"
            aria-label="Rechercher"
            style={{
              width: "40px", height: "40px",
              backgroundColor: searchOpen ? C.emerald : C.sage,
              border: `1px solid ${searchOpen ? C.emerald : C.border}`,
              color: searchOpen ? C.white : C.emerald,
              cursor: "pointer",
            }}
          >
            {searchOpen ? <X size={17} strokeWidth={1.8} /> : <Search size={17} strokeWidth={1.8} />}
          </button>

          {/* Bouton notifications avec pastille rouge si non-lues */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setSearchOpen(false); }}
              className="relative flex items-center justify-center rounded-lg"
              aria-label={`Notifications, ${unreadCount} nouvelles`}
              aria-expanded={notifOpen}
              style={{
                width: "40px", height: "40px",
                backgroundColor: notifOpen ? C.emerald : C.sage,
                border: `1px solid ${notifOpen ? C.emerald : C.border}`,
                color: notifOpen ? C.white : C.emerald,
                cursor: "pointer",
              }}
            >
              <Bell size={17} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span
                  className="absolute rounded-full"
                  style={{
                    top: "6px", right: "6px",
                    width: "8px", height: "8px",
                    backgroundColor: C.terra,
                    border: `2px solid ${notifOpen ? C.emerald : C.sage}`,
                  }}
                />
              )}
            </button>
          </div>

          {/* Bouton "Nouveau colis" (cache sur les tres petits ecrans) */}
          <Link
            href="/dashboard/nouveau"
            className="hidden sm:flex items-center gap-2 rounded-lg"
            style={{
              backgroundColor: C.emerald, color: C.ivory,
              padding: "9px 16px",
              fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600,
              textDecoration: "none",
              minHeight: "40px",
            }}
          >
            <PlusCircle size={15} strokeWidth={2} />
            Nouveau colis
          </Link>
        </div>
      </div>

      {/* -- Barre de recherche depliable (sous la topbar) -- */}
      {searchOpen && (
        <div className="px-4 pb-3 md:px-8" style={{ backgroundColor: C.white }}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.taupeLight }} />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                placeholder="Tracking, destinataire, ville..."
                className="w-full rounded-lg"
                style={{
                  padding: "10px 14px 10px 38px",
                  fontSize: "16px",  // 16px pour eviter le zoom automatique iOS
                  backgroundColor: C.ivory,
                  border: `1px solid ${C.border}`,
                  color: C.anthracite, outline: "none",
                  minHeight: "44px",
                }}
              />
            </div>
            <button
              onClick={handleSearch}
              className="rounded-lg shrink-0"
              style={{ padding: "10px 16px", backgroundColor: C.emerald, color: C.white, border: "none", fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer", minHeight: "44px" }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* -- Panneau notifications -- */}
      {/* CORRECTION MOBILE : sur telephone, on l'affiche comme une "feuille" en bas de l'ecran */}
      {/* Sur desktop, on garde le dropdown a droite */}
      {notifOpen && (
        <>
          {/* Fond noir cliquable (mobile uniquement) pour fermer */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setNotifOpen(false)}
            aria-hidden="true"
          />

          {/* -- Panneau notif : bottom sheet sur mobile, dropdown sur desktop -- */}
          {/* Classes Tailwind :                                                   */}
          {/*   Mobile (par defaut) : fixed en bas, plein largeur, max 70dvh       */}
          {/*   Desktop (md+)       : absolute sous le bouton, 360px de large      */}
          <div
            className="
              fixed bottom-0 left-0 right-0 z-50 shadow-lg
              md:absolute md:top-full md:bottom-auto md:left-auto md:right-8
              md:mt-2 md:w-[360px]
              rounded-t-2xl md:rounded-2xl
            "
            style={{
              backgroundColor: C.white,
              overflow: "hidden",
              border: `1px solid ${C.border}`,
              // maxHeight : sur mobile 70% de la fenetre, sur desktop 400px
              // On utilise dvh pour bien s'adapter aux barres iOS
              maxHeight: "70dvh",
            }}
          >
            <div>
              {/* Indicateur visuel de "feuille tirable" sur mobile */}
              <div className="md:hidden flex justify-center pt-3 pb-1" aria-hidden="true">
                <div style={{ width: "36px", height: "4px", backgroundColor: C.border, borderRadius: "2px" }} />
              </div>

              {/* En-tete du panneau */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid ${C.border}` }}
              >
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: C.anthracite }}>
                  Notifications
                </div>
                <button
                  onClick={() => setNotifOpen(false)}
                  aria-label="Fermer les notifications"
                  style={{ background: "none", border: "none", color: C.taupe, cursor: "pointer", minWidth: "32px", minHeight: "32px" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Liste des notifs (scrollable en interne) */}
              {NOTIFICATIONS.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={28} style={{ color: C.border, margin: "0 auto 10px" }} />
                  <p style={{ fontSize: "13px", color: C.taupe }}>Aucune notification</p>
                </div>
              ) : (
                <div style={{
                  // Scrollable si beaucoup de notifs
                  overflowY: "auto",
                  // Max-height calculee pour laisser de la place a l'en-tete + safe-area
                  maxHeight: "calc(70dvh - 120px)",
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}>
                  {NOTIFICATIONS.map((n) => (
                    <button
                      key={n.id}
                      className="w-full text-left transition-colors"
                      style={{
                        padding: "12px 16px",
                        borderBottom: `1px solid ${C.border}`,
                        backgroundColor: n.read ? "transparent" : C.emeraldSoft,
                        cursor: "pointer",
                        border: "none",
                        borderBottomWidth: "1px",
                        borderBottomStyle: "solid",
                        borderBottomColor: C.border,
                        display: "block",
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        {!n.read && (
                          <span
                            className="rounded-full shrink-0 mt-1.5"
                            style={{ width: "6px", height: "6px", backgroundColor: C.emerald }}
                            aria-label="Non lu"
                          />
                        )}
                        <div className={n.read ? "ml-3.5 flex-1" : "flex-1"}>
                          <p style={{ fontSize: "13px", color: C.anthracite, lineHeight: 1.5 }}>{n.text}</p>
                          <p style={{ fontSize: "11px", color: C.taupeLight, marginTop: "3px" }}>{n.time}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Padding en bas pour tenir compte du safe-area sur iPhone */}
              <div style={{ height: "env(safe-area-inset-bottom)" }} className="md:hidden" />
            </div>
          </div>
        </>
      )}
    </header>
  );
}


// ============================================================
// COMPOSANT BOTTOMNAV (barre du bas, uniquement sur mobile)
// Navigation rapide vers les 5 pages principales
// ============================================================
function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/dashboard",            label: "Accueil",   icon: LayoutDashboard },
    { href: "/dashboard/colis",      label: "Colis",     icon: Package },
    { href: "/dashboard/nouveau",    label: "Nouveau",   icon: PlusCircle },
    { href: "/dashboard/paiements",  label: "Paiements", icon: CreditCard },
    { href: "/dashboard/parametres", label: "Compte",    icon: Settings },
  ];

  return (
    <nav
      aria-label="Navigation mobile"
      className="md:hidden flex items-center"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        backgroundColor: C.white,
        borderTop: `1px solid ${C.border}`,
        height: "60px",
        // Prend en compte l'encoche du bas sur iPhone
        paddingBottom: "env(safe-area-inset-bottom)",
        // Empeche le debordement horizontal
        maxWidth: "100%",
        overflowX: "hidden",
        // Laisse depasser le bouton rond "Nouveau" sans le rogner
        overflowY: "visible",
      }}
    >
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        const isNew = item.href === "/dashboard/nouveau";

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
            style={{
              color: isActive ? C.emerald : C.taupeLight,
              textDecoration: "none",
              minHeight: "44px",
              // Empeche le texte d'ecraser les icones
              minWidth: 0,
            }}
            aria-current={isActive ? "page" : undefined}
          >
            {isNew ? (
              // Le bouton "Nouveau" est mis en avant : rond vert qui remonte
              <span
                className="flex items-center justify-center rounded-full"
                style={{
                  width: "38px", height: "38px",
                  backgroundColor: C.emerald, color: C.white,
                  marginTop: "-14px",
                  boxShadow: "0 2px 8px rgba(11,77,63,0.4)",
                }}
              >
                <Icon size={18} strokeWidth={2} />
              </span>
            ) : (
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            )}
            <span style={{
              fontSize: "10px",
              lineHeight: 1.2,
              fontFamily: "var(--font-heading)",
              fontWeight: isActive ? 700 : 500,
              marginTop: isNew ? "2px" : "0",
              // Tronque proprement au lieu de deborder
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}


// ============================================================
// LAYOUT PRINCIPAL DU DASHBOARD
// Assemble la sidebar + topbar + zone de contenu + bottomnav
// C'est ce composant qui empeche les debordements horizontaux
// ============================================================
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // -- Ferme automatiquement la sidebar en passant en desktop --
  // Evite qu'elle reste ouverte en trop si on redimensionne
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setSidebarOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // -- Bloque le scroll de la page quand la sidebar mobile est ouverte --
  // Sinon on peut scroller derriere l'overlay, ce qui est confusant
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div
      className="flex overflow-hidden"
      style={{
        // dvh = dynamic viewport height, s'adapte aux barres iOS
        height: "100dvh",
        maxHeight: "100dvh",
        // -- FIX RESPONSIVE PRINCIPAL --
        // Force le layout a ne jamais depasser la largeur de l'ecran
        maxWidth: "100%",
        width: "100%",
        overflowX: "hidden",
        backgroundColor: C.ivory,
      }}
    >
      {/* Barre laterale (fixe a gauche sur desktop, glissante sur mobile) */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Zone principale : topbar + contenu */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          // -- IMPORTANT : min-width: 0 permet a flex-1 de "shrinker" correctement --
          // Sans ca, un enfant trop large pousse tout le conteneur
          minWidth: 0,
          maxWidth: "100%",
        }}
      >
        <TopBar onMenuOpen={() => setSidebarOpen(true)} />

        {/* -- Zone de contenu (les pages du dashboard) -- */}
        {/* overflow-y-auto = scroll vertical seulement */}
        {/* overflow-x-hidden = pas de scroll horizontal (le contenu s'y adapte) */}
        {/* pb-[60px] sur mobile pour laisser de la place a la BottomNav */}
        <main
          className="flex-1 pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-0"
          style={{
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "none",
            WebkitOverflowScrolling: "touch",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>

      {/* Barre du bas (mobile uniquement, fixed positionne) */}
      <BottomNav />
    </div>
  );
}
