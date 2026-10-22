// ============================================================
// SENI CORP metier — Coque du tableau de bord
//
// La navigation depend du role. Elle ne remplace pas le controle
// d'acces : le backend refuse de toute facon ce qui n'est pas permis.
// Masquer une entree evite simplement de proposer une impasse.
// ============================================================

"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Package, Truck, Route as RouteIcon, Users, MapPin,
  Menu, X, LogOut,
} from "lucide-react";
import type { Role } from "@/lib/statuts";
import { logout as apiLogout, type UserInfo } from "@/lib/api";
import { useUtilisateur } from "@/lib/queries";
import { C } from "@/lib/tokens";

interface Entree {
  href: string;
  label: string;
  icon: typeof Package;
  section: string;
  roles: Role[];
}

const NAVIGATION: Entree[] = [
  { href: "/dashboard", label: "Colis", icon: Package, section: "Exploitation",
    roles: ["AGENT", "CHAUFFEUR", "DISPATCHER", "ADMIN"] },
  { href: "/dashboard/tournees", label: "Tournees", icon: RouteIcon, section: "Exploitation",
    roles: ["AGENT", "CHAUFFEUR", "DISPATCHER", "ADMIN"] },
  { href: "/dashboard/flotte", label: "Flotte", icon: Truck, section: "Ressources",
    roles: ["DISPATCHER", "ADMIN"] },
  { href: "/dashboard/chauffeurs", label: "Chauffeurs", icon: Users, section: "Ressources",
    roles: ["DISPATCHER", "ADMIN"] },
  { href: "/dashboard/lignes", label: "Lignes", icon: MapPin, section: "Ressources",
    roles: ["DISPATCHER", "ADMIN"] },
];

/** Libelle du poste, affiche sous le nom. */
function libellePoste(user: UserInfo): string {
  switch (user.role) {
    case "ADMIN": return "Administration";
    case "DISPATCHER": return "Dispatch";
    case "CHAUFFEUR": return "Conduite";
    case "AGENT": return "Guichet";
    default: return user.role;
  }
}

function initiales(prenom?: string, nom?: string) {
  const deux = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`;
  return deux.toUpperCase() || "--";
}

function Sidebar({ ouvert, fermer }: { ouvert: boolean; fermer: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useUtilisateur();
  const [confirmer, setConfirmer] = useState(false);

  const entrees = NAVIGATION.filter((e) => !user || e.roles.includes(user.role));
  let derniereSection = "";

  const deconnecter = async () => {
    setConfirmer(false);
    await apiLogout();
    // Sans ce vidage, le compte suivant verrait brievement les donnees du
    // precedent, qui n'a pas forcement la meme portee de lecture.
    queryClient.clear();
    router.replace("/login");
  };

  return (
    <>
      {ouvert && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={fermer}
          aria-hidden="true"
        />
      )}

      <nav
        aria-label="Navigation principale"
        className={`fixed top-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-out md:translate-x-0 ${
          ouvert ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: "256px",
          backgroundColor: C.emerald,
          height: "100dvh",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-2">
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 800, letterSpacing: "3px", color: C.white }}>
              SENI CORP
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "2px", color: C.bronzeLight, textTransform: "uppercase", marginTop: "2px" }}>
              Exploitation
            </div>
          </div>
          <button
            onClick={fermer}
            className="md:hidden p-1 rounded-md"
            aria-label="Fermer le menu"
            style={{ color: C.bronzeLight, background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Defilable si la fenetre est courte, mais sans barre visible :
            une barre claire sur ce fond vert doublerait celle de la page. */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4">
          {entrees.map((entree) => {
            const nouvelleSection = entree.section !== derniereSection;
            if (nouvelleSection) derniereSection = entree.section;
            const actif = pathname === entree.href;
            const Icon = entree.icon;

            return (
              <div key={entree.href}>
                {nouvelleSection && (
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: C.bronzeLight, opacity: 0.6, padding: "16px 12px 6px" }}>
                    {entree.section}
                  </div>
                )}
                <Link
                  href={entree.href}
                  onClick={fermer}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150"
                  aria-current={actif ? "page" : undefined}
                  style={{
                    backgroundColor: actif ? "rgba(184, 147, 90, 0.18)" : "transparent",
                    color: actif ? C.white : "rgba(250, 246, 240, 0.72)",
                    fontWeight: actif ? 500 : 400,
                    fontSize: "13.5px",
                    borderLeft: actif ? `3px solid ${C.bronze}` : "3px solid transparent",
                    textDecoration: "none",
                    minHeight: "40px",
                  }}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  {entree.label}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="px-3 pb-5">
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{
                width: "36px", height: "36px",
                background: `linear-gradient(135deg, ${C.bronze}, ${C.bronzeLight})`,
                fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 700, color: C.emeraldDark,
              }}
            >
              {initiales(user?.prenom, user?.nom)}
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: "13px", fontWeight: 600, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user ? `${user.prenom} ${user.nom}` : "—"}
              </div>
              <div style={{ fontSize: "10px", color: "rgba(250, 246, 240, 0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user ? libellePoste(user) : ""}
              </div>
            </div>
            <button
              onClick={() => setConfirmer(true)}
              aria-label="Se deconnecter"
              style={{ color: "rgba(250, 246, 240, 0.4)", background: "none", border: "none", cursor: "pointer", minWidth: "44px", minHeight: "44px" }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

      {confirmer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog" aria-modal="true">
          <div className="rounded-2xl" style={{ backgroundColor: C.white, padding: "28px", maxWidth: "380px", width: "100%" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.anthracite, marginBottom: "8px" }}>
              Se deconnecter ?
            </h3>
            <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "20px", lineHeight: 1.6 }}>
              Tu reviendras a la page de connexion.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmer(false)}
                className="flex-1 rounded-lg"
                style={{ padding: "10px", border: `1px solid ${C.border}`, backgroundColor: C.white, color: C.taupe, fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer", minHeight: "44px" }}
              >
                Annuler
              </button>
              <button
                onClick={deconnecter}
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

/**
 * Salutation de la barre haute.
 *
 * Le compte d'administration est partage : y afficher le prenom de la
 * personne qui l'a cree preterait a confusion pour les autres.
 */
function salutation(user: UserInfo | null | undefined): string {
  if (!user) return "Bonjour";
  if (user.role === "ADMIN") return "Bonjour Admin";
  return `Bonjour ${user.prenom}`;
}

function BarreHaut({ ouvrirMenu }: { ouvrirMenu: () => void }) {
  const { data: user } = useUtilisateur();

  // La date depend du fuseau du visiteur. Calculee pendant le rendu
  // serveur, elle differerait de celle du navigateur et React rejetterait
  // tout le rendu recu. On attend donc le montage.
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(new Date().toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }));
  }, []);

  return (
    <header className="sticky top-0 z-30 shrink-0" style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={ouvrirMenu}
            className="md:hidden p-2 -ml-2 rounded-lg shrink-0"
            aria-label="Ouvrir le menu"
            style={{ color: C.emerald, background: "none", border: "none", cursor: "pointer", minWidth: "44px", minHeight: "44px" }}
          >
            <Menu size={22} />
          </button>
          <div className="min-w-0">
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 600, color: C.anthracite, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {salutation(user)}
            </h1>
            <p style={{ fontSize: "12px", color: C.taupe, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {date || " "}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Le menu mobile reste ouvert si on passe en grand ecran, ou il recouvre
  // la barre laterale deja visible. On le referme au franchissement.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const surChangement = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOuvert(false);
    };
    mq.addEventListener("change", surChangement);
    return () => mq.removeEventListener("change", surChangement);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOuvert ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOuvert]);

  return (
    // C'est la page entiere qui defile, avec la barre du navigateur.
    // Enfermer le contenu dans une zone a defilement propre dessinerait un
    // cadre au milieu de l'ecran et doublerait la barre de defilement.
    <div className="flex" style={{ minHeight: "100dvh", width: "100%", maxWidth: "100%", overflowX: "hidden", backgroundColor: C.ivory }}>
      <Sidebar ouvert={menuOuvert} fermer={() => setMenuOuvert(false)} />
      <div className="flex-1 flex flex-col md:ml-64" style={{ minWidth: 0, maxWidth: "100%" }}>
        <BarreHaut ouvrirMenu={() => setMenuOuvert(true)} />
        <main className="flex-1" style={{ maxWidth: "100%", minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
