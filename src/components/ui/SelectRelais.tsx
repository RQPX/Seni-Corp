// ============================================================
// SENI CORP — Selecteur de point relais
// Le popup d'un <select> natif est dessine par le systeme : aucune
// regle CSS ne l'atteint, d'ou son aspect etranger au reste du site.
// Ce composant le remplace par une liste qu'on maitrise entierement,
// groupee par ville, au clavier comme a la souris.
// ============================================================

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { C } from "@/lib/tokens";
import type { PointRelais } from "@/lib/api";

interface Props {
  relais: PointRelais[];
  value: number | null;
  onChange: (id: number) => void;
  /** Relais a retirer de la liste, typiquement celui deja choisi en face. */
  exclureId?: number | null;
  placeholder: string;
  ariaLabel: string;
}

export function SelectRelais({ relais, value, onChange, exclureId, placeholder, ariaLabel }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [indexActif, setIndexActif] = useState(0);
  const [versLeHaut, setVersLeHaut] = useState(false);

  const conteneur = useRef<HTMLDivElement>(null);
  const declencheur = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLDivElement>(null);

  const disponibles = useMemo(
    () => relais.filter((r) => r.id !== exclureId),
    [relais, exclureId]
  );

  // Groupe par ville pour que la liste reste lisible quand les relais se multiplient
  const groupes = useMemo(() => {
    const map = new Map<string, PointRelais[]>();
    disponibles.forEach((r) => {
      const liste = map.get(r.ville) ?? [];
      liste.push(r);
      map.set(r.ville, liste);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "fr"));
  }, [disponibles]);

  // Liste a plat : c'est elle que parcourent les fleches du clavier
  const aPlat = useMemo(() => groupes.flatMap(([, liste]) => liste), [groupes]);

  const choisi = relais.find((r) => r.id === value) ?? null;

  // -- Fermeture au clic exterieur --
  useEffect(() => {
    if (!ouvert) return;
    const auClic = (e: MouseEvent) => {
      if (conteneur.current && !conteneur.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    document.addEventListener("mousedown", auClic);
    return () => document.removeEventListener("mousedown", auClic);
  }, [ouvert]);

  // -- Ouvre vers le haut s'il n'y a pas la place en dessous --
  useEffect(() => {
    if (!ouvert || !declencheur.current) return;
    const r = declencheur.current.getBoundingClientRect();
    setVersLeHaut(window.innerHeight - r.bottom < 300 && r.top > 300);
    const depart = aPlat.findIndex((o) => o.id === value);
    setIndexActif(depart >= 0 ? depart : 0);
  }, [ouvert, aPlat, value]);

  // -- Garde l'option active visible pendant la navigation au clavier --
  useEffect(() => {
    if (!ouvert || !panneau.current) return;
    const el = panneau.current.querySelector<HTMLElement>(`[data-index="${indexActif}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [indexActif, ouvert]);

  const selectionner = (id: number) => {
    onChange(id);
    setOuvert(false);
    declencheur.current?.focus();
  };

  const auClavier = (e: React.KeyboardEvent) => {
    if (!ouvert) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        setOuvert(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOuvert(false);
      declencheur.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndexActif((i) => Math.min(i + 1, aPlat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndexActif((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setIndexActif(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setIndexActif(aPlat.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = aPlat[indexActif];
      if (opt) selectionner(opt.id);
    }
  };

  let compteur = -1;

  return (
    <div ref={conteneur} className="relative" style={{ width: "100%" }}>
      <button
        ref={declencheur}
        type="button"
        onClick={() => setOuvert((o) => !o)}
        onKeyDown={auClavier}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        className="flex items-center justify-between gap-2 rounded-xl w-full"
        style={{
          padding: "12px 14px",
          minHeight: "48px",
          fontSize: "15px",
          fontFamily: "var(--font-body)",
          textAlign: "left",
          backgroundColor: C.ivory,
          border: `1px solid ${ouvert ? C.emerald : C.border}`,
          boxShadow: ouvert ? `0 0 0 3px ${C.emeraldSoft}` : "none",
          color: choisi ? C.anthracite : C.taupeLight,
          cursor: "pointer",
          transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
        }}
      >
        <span className="flex items-center gap-2 min-w-0">
          {choisi && <MapPin size={15} strokeWidth={2} style={{ color: C.bronze, flexShrink: 0 }} />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {choisi ? choisi.nom : placeholder}
          </span>
        </span>
        <ChevronDown
          size={17}
          strokeWidth={2}
          style={{
            color: C.taupe,
            flexShrink: 0,
            transform: ouvert ? "rotate(180deg)" : "none",
            transition: "transform 150ms ease-out",
          }}
        />
      </button>

      {ouvert && (
        <div
          ref={panneau}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 rounded-xl"
          style={{
            left: 0,
            right: 0,
            [versLeHaut ? "bottom" : "top"]: "calc(100% + 6px)",
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            boxShadow: "0 12px 24px rgba(11, 77, 63, 0.12)",
            maxHeight: "280px",
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: "6px",
          }}
        >
          {groupes.length === 0 && (
            <div style={{ padding: "12px 10px", fontSize: "13px", color: C.taupeLight }}>
              Aucun relais disponible.
            </div>
          )}

          {groupes.map(([ville, liste]) => (
            <div key={ville}>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: C.bronze,
                  padding: "10px 10px 4px",
                }}
              >
                {ville}
              </div>

              {liste.map((r) => {
                compteur += 1;
                const index = compteur;
                const estChoisi = r.id === value;
                const estActif = index === indexActif;
                return (
                  <div
                    key={r.id}
                    role="option"
                    aria-selected={estChoisi}
                    data-index={index}
                    onClick={() => selectionner(r.id)}
                    onMouseEnter={() => setIndexActif(index)}
                    className="flex items-center justify-between gap-2 rounded-lg"
                    style={{
                      padding: "10px 10px",
                      minHeight: "44px",
                      fontSize: "14px",
                      cursor: "pointer",
                      color: C.anthracite,
                      backgroundColor: estChoisi ? C.emeraldSoft : estActif ? C.sage : "transparent",
                      fontWeight: estChoisi ? 600 : 400,
                    }}
                  >
                    <span className="min-w-0" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.nom}
                    </span>
                    {estChoisi && <Check size={15} strokeWidth={2.5} style={{ color: C.emerald, flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
