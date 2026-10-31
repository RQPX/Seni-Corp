// ============================================================
// Trajet d'un colis : depart et arrivee relies en pointilles
//
// Empile verticalement pour tenir dans un panneau etroit et sur
// telephone. Un rond vert marque le depart, un point bronze l'arrivee.
// La couleur ne porte aucune information seule : chaque etape dit en
// toutes lettres s'il s'agit du depart ou de l'arrivee.
//
// Ce fichier existe en double dans apps/admin et apps/commercant
// (pas de paquet partage, voir README). Modifier les deux ensemble.
// ============================================================

import { C } from "@/lib/tokens";

interface Etape {
  nom: string;
  ville: string;
}

const POINT = 10;     // diametre des points
const LIGNE_TEXTE = 20; // hauteur de ligne du nom, sur laquelle le point se centre

function Point({ type }: { type: "depart" | "arrivee" }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: `${POINT}px`, height: `${POINT}px`, borderRadius: "50%", flexShrink: 0,
        boxSizing: "border-box",
        backgroundColor: type === "depart" ? C.white : C.bronze,
        border: type === "depart" ? `2.5px solid ${C.emerald}` : "none",
      }}
    />
  );
}

function Pointilles({ hauteur }: { hauteur?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 0, flex: hauteur ? "none" : 1, height: hauteur,
        minHeight: hauteur ? undefined : "12px",
        borderLeft: `2px dashed ${C.taupeLight}`,
      }}
    />
  );
}

function Texte({ etape, role }: { etape: Etape; role: string }) {
  return (
    <div className="min-w-0">
      <div style={{ fontSize: "13.5px", fontWeight: 600, lineHeight: `${LIGNE_TEXTE}px`, color: C.anthracite, overflowWrap: "break-word" }}>
        {etape.nom}
      </div>
      <div style={{ fontSize: "11.5px", color: C.taupe, marginTop: "1px" }}>
        {etape.ville} {"·"} {role}
      </div>
    </div>
  );
}

export function Trajet({ origine, destination }: { origine: Etape; destination: Etape }) {
  const decalage = (LIGNE_TEXTE - POINT) / 2;

  return (
    <div role="group" aria-label={`Trajet de ${origine.nom} a ${destination.nom}`}>
      {/* Depart : le point, puis les pointilles qui descendent jusqu'au bas de la ligne */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center" style={{ width: `${POINT}px`, paddingTop: `${decalage}px` }}>
          <Point type="depart" />
          <Pointilles />
        </div>
        <div style={{ paddingBottom: "14px", minWidth: 0 }}>
          <Texte etape={origine} role="Depart" />
        </div>
      </div>

      {/* Arrivee : les pointilles reprennent en haut, puis le point */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center" style={{ width: `${POINT}px` }}>
          <Pointilles hauteur={`${decalage}px`} />
          <Point type="arrivee" />
        </div>
        <Texte etape={destination} role="Arrivee" />
      </div>
    </div>
  );
}
