// ============================================================
// SENI CORP — Layout Dashboard
// Enveloppe toutes les pages protegees (dashboard, colis, etc.)
// Contient la sidebar et la barre superieure.
// "use client" car on utilise useState pour le menu mobile.
// ============================================================

"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  LayoutDashboard, Package, PlusCircle, CreditCard, FileText,
  Settings, HelpCircle, Menu, X, Bell, Search, LogOut
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const C = {
  emerald: "#0B4D3F", emeraldDark: "#083528", emeraldLight: "#1A6B58",
  emeraldSoft: "#E8F0ED", bronze: "#B8935A", bronzeLight: "#D4B486",
  ivory: "#FAF6F0", sage: "#E8EDE5", anthracite: "#1A1A1A",
  taupe: "#6B6259", taupeLight: "#9B8A7E", terra: "#C66D4F",
  border: "#EAE3D5", success: "#4A6B5C", white: "#FFFFFF",
};

const NAV_ITEMS = [
  { href: "/dashboard",         label: "Tableau de bord", icon: LayoutDashboard, section: "Pilotage" },
  { href: "/dashboard/colis",   label: "Mes colis",       icon: Package,         section: "Pilotage" },
  { href: "/dashboard/nouveau", label: "Nouveau colis",   icon: PlusCircle,      section: "Pilotage" },
  { href: "/dashboard/paiements", label: "Paiements",     icon: CreditCard,      section: "Finance" },
  { href: "/dashboard/factures",  label: "Factures",      icon: FileText,        section: "Finance" },
  { href: "/dashboard/parametres", label: "Parametres",   icon: Settings,        section: "Compte" },
  { href: "/dashboard/aide",      label: "Aide",          icon: HelpCircle,      section: "Compte" },
];

const NOTIFICATIONS = [
  { id: 1, text: "Colis SC-2026-A8K4M2 livre a Korhogo", time: "il y a 12 min", read: false },
  { id: 2, text: "Colis SC-2026-B2F7N9 arrive au relais Bouake", time: "il y a 45 min", read: false },
  { id: 3, text: "Recharge de 50 000 XOF confirmee via CinetPay", time: "il y a 1 h", read: true },
  { id: 4, text: "Facture mars 2026 disponible", time: "il y a 2 jours", read: true },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  let lastSection = "";

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    router.push("/login");
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={onClose} aria-hidden="true" />
      )}
      <nav aria-label="Navigation principale"
        className={`fixed top-0 left-0 z-50 h-full flex flex-col transition-transform duration-300 ease-out md:relative md:translate-x-0 md:z-auto ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: "256px", backgroundColor: C.emerald }}>
        <div className="flex items-center justify-between px-5 pt-6 pb-2">
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 800, letterSpacing: "3px", color: C.white }}>SENI CORP</div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "2px", color: C.bronzeLight, textTransform: "uppercase", marginTop: "2px" }}>Logistique</div>
          </div>
          <button onClick={onClose} className="md:hidden p-1 rounded-md" aria-label="Fermer le menu" style={{ color: C.bronzeLight, background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const showSection = item.section !== lastSection;
            if (showSection) lastSection = item.section;
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <div key={item.href}>
                {showSection && (<div style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: C.bronzeLight, opacity: 0.6, padding: "16px 12px 6px" }}>{item.section}</div>)}
                <Link href={item.href} onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150"
                  aria-current={isActive ? "page" : undefined}
                  style={{ backgroundColor: isActive ? "rgba(184, 147, 90, 0.18)" : "transparent", color: isActive ? C.white : "rgba(250, 246, 240, 0.72)", fontWeight: isActive ? 500 : 400, fontSize: "13.5px", borderLeft: isActive ? `3px solid ${C.bronze}` : "3px solid transparent", textDecoration: "none" }}>
                  <Icon size={17} strokeWidth={1.8} />{item.label}
                </Link>
              </div>
            );
          })}
        </div>
        <div className="px-3 pb-5">
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
            <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: "36px", height: "36px", background: `linear-gradient(135deg, ${C.bronze}, ${C.bronzeLight})`, fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 700, color: C.emeraldDark }}>SN</div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: "13px", fontWeight: 600, color: C.white }}>Seni N'Diaye</div>
              <div style={{ fontSize: "10px", color: "rgba(250, 246, 240, 0.6)" }}>Mode Adjame</div>
            </div>
            <button onClick={() => setShowLogoutConfirm(true)} aria-label="Se deconnecter" style={{ color: "rgba(250, 246, 240, 0.4)", background: "none", border: "none", cursor: "pointer" }}><LogOut size={16} /></button>
          </div>
        </div>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="rounded-2xl mx-4" style={{ backgroundColor: C.white, padding: "28px", maxWidth: "380px", width: "100%" }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.anthracite, marginBottom: "8px" }}>Se deconnecter ?</h3>
              <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "20px", lineHeight: 1.6 }}>Vous allez etre redirige vers la page de connexion.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-lg" style={{ padding: "10px", border: `1px solid ${C.border}`, backgroundColor: C.white, color: C.taupe, fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
                <button onClick={handleLogout} className="flex-1 rounded-lg" style={{ padding: "10px", border: "none", backgroundColor: C.terra, color: C.white, fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Deconnexion</button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

function TopBar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus(); }, [searchOpen]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/dashboard/colis?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header className="relative" style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4">
        <div className="flex items-center gap-3">
          <button onClick={onMenuOpen} className="md:hidden p-2 -ml-2 rounded-lg" aria-label="Ouvrir le menu" style={{ color: C.emerald, background: "none", border: "none", cursor: "pointer" }}><Menu size={22} /></button>
          <div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 600, color: C.anthracite }}>BONJOUR SENI</h1>
            <p style={{ fontSize: "12px", color: C.taupe, marginTop: "2px" }}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setSearchOpen(!searchOpen); setNotifOpen(false); }} className="flex items-center justify-center rounded-lg"
            aria-label="Rechercher" style={{ width: "38px", height: "38px", backgroundColor: searchOpen ? C.emerald : C.sage, border: `1px solid ${searchOpen ? C.emerald : C.border}`, color: searchOpen ? C.white : C.emerald, cursor: "pointer" }}>
            {searchOpen ? <X size={17} strokeWidth={1.8} /> : <Search size={17} strokeWidth={1.8} />}
          </button>
          <div ref={notifRef} className="relative">
            <button onClick={() => { setNotifOpen(!notifOpen); setSearchOpen(false); }} className="relative flex items-center justify-center rounded-lg"
              aria-label={`Notifications, ${unreadCount} nouvelles`} style={{ width: "38px", height: "38px", backgroundColor: notifOpen ? C.emerald : C.sage, border: `1px solid ${notifOpen ? C.emerald : C.border}`, color: notifOpen ? C.white : C.emerald, cursor: "pointer" }}>
              <Bell size={17} strokeWidth={1.8} />
              {unreadCount > 0 && <span className="absolute rounded-full" style={{ top: "6px", right: "6px", width: "8px", height: "8px", backgroundColor: C.terra, border: `2px solid ${notifOpen ? C.emerald : C.sage}` }} />}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 rounded-xl shadow-lg z-50" style={{ width: "min(340px, calc(100vw - 16px))", backgroundColor: C.white, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 700, color: C.anthracite }}>Notifications</div>
                </div>
                {NOTIFICATIONS.length === 0 ? (
                  <div className="px-4 py-8 text-center"><Bell size={28} style={{ color: C.border, margin: "0 auto 10px" }} /><p style={{ fontSize: "13px", color: C.taupe }}>Aucune notification</p></div>
                ) : (
                  <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                    {NOTIFICATIONS.map((n) => (
                      <div key={n.id} className="px-4 py-3 cursor-pointer transition-colors" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: n.read ? "transparent" : C.emeraldSoft }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.sage}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.read ? "transparent" : C.emeraldSoft}>
                        <div className="flex items-start gap-2.5">
                          {!n.read && <span className="rounded-full shrink-0 mt-1.5" style={{ width: "6px", height: "6px", backgroundColor: C.emerald }} />}
                          <div className={n.read ? "ml-3.5" : ""}>
                            <p style={{ fontSize: "12.5px", color: C.anthracite, lineHeight: 1.5 }}>{n.text}</p>
                            <p style={{ fontSize: "10px", color: C.taupeLight, marginTop: "3px" }}>{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Link href="/dashboard/nouveau" className="hidden sm:flex items-center gap-2 rounded-lg" style={{ backgroundColor: C.emerald, color: C.ivory, padding: "9px 16px", fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            <PlusCircle size={15} strokeWidth={2} />Nouveau colis
          </Link>
        </div>
      </div>
      {searchOpen && (
        <div className="px-4 pb-3 md:px-8" style={{ backgroundColor: C.white }}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.taupeLight }} />
              <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                placeholder="Rechercher par tracking, destinataire, ville..."
                className="w-full rounded-lg" style={{ padding: "10px 14px 10px 38px", fontSize: "14px", backgroundColor: C.ivory, border: `1px solid ${C.border}`, color: C.anthracite, outline: "none" }} />
            </div>
            <button onClick={handleSearch} className="rounded-lg shrink-0" style={{ padding: "10px 16px", backgroundColor: C.emerald, color: C.white, border: "none", fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Rechercher</button>
          </div>
        </div>
      )}
    </header>
  );
}

// Barre de navigation fixe en bas, visible uniquement sur mobile
function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/dashboard",         label: "Accueil",  icon: LayoutDashboard },
    { href: "/dashboard/colis",   label: "Colis",    icon: Package },
    { href: "/dashboard/nouveau", label: "Nouveau",  icon: PlusCircle },
    { href: "/dashboard/paiements", label: "Paiements", icon: CreditCard },
    { href: "/dashboard/parametres", label: "Compte",  icon: Settings },
  ];
  return (
    <nav aria-label="Navigation mobile" className="md:hidden flex items-center border-t" style={{ backgroundColor: C.white, borderColor: C.border, height: "60px" }}>
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        const isNew = item.href === "/dashboard/nouveau";
        return (
          <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
            style={{ color: isActive ? C.emerald : C.taupeLight, textDecoration: "none", position: "relative" }}>
            {isNew ? (
              // Bouton "Nouveau" mis en avant avec fond vert
              <span className="flex items-center justify-center rounded-full" style={{ width: "36px", height: "36px", backgroundColor: C.emerald, color: C.white, marginTop: "-14px", boxShadow: "0 2px 8px rgba(11,77,63,0.4)" }}>
                <Icon size={18} strokeWidth={2} />
              </span>
            ) : (
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            )}
            <span style={{ fontSize: "9px", fontFamily: "var(--font-heading)", fontWeight: isActive ? 700 : 500, marginTop: isNew ? "2px" : "0" }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: C.ivory }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuOpen={() => setSidebarOpen(true)} />
        {/* pb-[60px] sur mobile pour ne pas etre cache par la BottomNav */}
        <main className="flex-1 overflow-y-auto pb-[60px] md:pb-0">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
