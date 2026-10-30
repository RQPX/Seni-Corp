// ============================================================
// Ecran de traitement des colis
//
// C'est la boucle de travail quotidienne : trouver un colis, l'ouvrir,
// faire avancer son statut. La pagination et la recherche sont faites
// par le serveur, qui restreint aussi la liste a la portee du poste :
// un agent ne voit que les colis de son agence.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { Search, X, ChevronRight, Loader2, AlertCircle, PackageOpen } from "lucide-react";
import { ApiError, type Colis } from "@/lib/api";
import { STATUTS, type StatutColis } from "@/lib/statuts";
import { useColis } from "@/lib/queries";
import { formatMontant, formatPoids } from "@/lib/utils";
import { StatutBadge } from "@/components/StatutBadge";
import { ColisPanel } from "@/components/ColisPanel";
import { C } from "@/lib/tokens";

const PAR_PAGE = 20;

/** Statuts proposes au filtre, dans l'ordre du parcours puis les exceptions. */
const OPTIONS_STATUT = (Object.keys(STATUTS) as StatutColis[]).sort(
  (a, b) => (STATUTS[a].ordre || 99) - (STATUTS[b].ordre || 99),
);

function CarteColis({ colis, ouvrir }: { colis: Colis; ouvrir: () => void }) {
  return (
    // La carte entiere est le bouton. Avec un chevron seul cliquable, la
    // zone utile fait 20 px au milieu d'une ligne de 60 px de haut.
    <button
      onClick={ouvrir}
      className="w-full text-left rounded-xl transition-colors duration-150"
      style={{
        backgroundColor: C.white,
        border: `1px solid ${C.border}`,
        padding: "14px 16px",
        cursor: "pointer",
        display: "block",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: C.anthracite, letterSpacing: "0.3px" }}>
              {colis.tracking}
            </span>
            <StatutBadge statut={colis.statut} taille="petite" />
          </div>
          <div style={{ fontSize: "13.5px", color: C.anthracite, marginTop: "5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {colis.destinataireNom}
          </div>
          <div style={{ fontSize: "11.5px", color: C.taupe, marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {colis.origine.ville} vers {colis.destination.ville}
            {" · "}
            {formatPoids(colis.poidsGrammes)}
            {" · "}
            {formatMontant(colis.montant)} XOF
          </div>
        </div>
        <ChevronRight size={18} style={{ color: C.taupeLight, flexShrink: 0 }} aria-hidden="true" />
      </div>
    </button>
  );
}

export default function PageColis() {
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<StatutColis | "">("");
  const [page, setPage] = useState(1);
  const [ouvert, setOuvert] = useState<number | null>(null);

  // Un filtre change le nombre de resultats : rester en page 4 afficherait
  // une liste vide alors qu'il y a des colis.
  useEffect(() => { setPage(1); }, [recherche, statut]);

  const { data, isLoading, isFetching, error } = useColis({
    page,
    parPage: PAR_PAGE,
    ...(recherche ? { recherche } : {}),
    ...(statut ? { statut } : {}),
  });

  const lancerRecherche = () => setRecherche(saisie.trim());

  // Vider le champ doit relancer la requete sans filtre, sinon la liste
  // reste bloquee sur l'ancien terme.
  const effacer = () => { setSaisie(""); setRecherche(""); };

  const colis = data?.elements ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: "980px" }} className="md:px-8">
      <div className="mb-5">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: C.anthracite }}>
          Colis
        </h2>
        <p style={{ fontSize: "13px", color: C.taupe, marginTop: "4px" }}>
          {isLoading
            ? "Chargement"
            : total === 0
              ? "Aucun colis"
              : `${total} colis dans la liste`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1" style={{ minWidth: 0 }}>
          <Search size={16} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: C.taupeLight, pointerEvents: "none" }} />
          <input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value.slice(0, 60))}
            onKeyDown={(e) => { if (e.key === "Enter") lancerRecherche(); }}
            placeholder="Numero de suivi ou nom du destinataire"
            aria-label="Rechercher un colis"
            className="w-full rounded-lg"
            style={{
              padding: "11px 38px 11px 38px",
              border: `1px solid ${C.border}`,
              backgroundColor: C.white,
              fontSize: "13.5px",
              color: C.anthracite,
              minHeight: "44px",
            }}
          />
          {saisie && (
            <button
              onClick={effacer}
              aria-label="Effacer la recherche"
              style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.taupeLight, cursor: "pointer", width: "32px", height: "32px" }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value as StatutColis | "")}
          aria-label="Filtrer par statut"
          className="rounded-lg"
          style={{
            padding: "11px 14px",
            border: `1px solid ${C.border}`,
            backgroundColor: C.white,
            fontSize: "13.5px",
            color: C.anthracite,
            minHeight: "44px",
          }}
        >
          <option value="">Tous les statuts</option>
          {OPTIONS_STATUT.map((s) => (
            <option key={s} value={s}>{STATUTS[s].label}</option>
          ))}
        </select>

        <button
          onClick={lancerRecherche}
          className="rounded-lg shrink-0"
          style={{
            padding: "11px 20px",
            border: "none",
            backgroundColor: C.emerald,
            color: C.white,
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            minHeight: "44px",
          }}
        >
          Rechercher
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl" style={{ backgroundColor: C.terraSoft, padding: "14px" }}>
          <AlertCircle size={16} style={{ color: C.terra, marginTop: "1px", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", color: C.error, lineHeight: 1.6 }}>
            {error instanceof ApiError
              ? error.messages.join(" ")
              : "La liste n'a pas pu etre chargee. Verifie le reseau et reessaie."}
          </span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2" style={{ color: C.taupe, fontSize: "13px", padding: "32px 0" }}>
          <Loader2 size={16} className="animate-spin" />
          Chargement des colis
        </div>
      )}

      {!isLoading && !error && colis.length === 0 && (
        <div
          className="flex flex-col items-center text-center rounded-xl"
          style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "40px 24px" }}
        >
          <PackageOpen size={28} strokeWidth={1.5} style={{ color: C.taupeLight }} />
          <p style={{ fontSize: "14px", color: C.anthracite, marginTop: "12px", fontWeight: 600 }}>
            Aucun colis a afficher
          </p>
          <p style={{ fontSize: "12.5px", color: C.taupe, marginTop: "6px", lineHeight: 1.6, maxWidth: "320px" }}>
            {recherche || statut
              ? "Essaie un autre terme de recherche ou retire le filtre de statut."
              : "Les colis apparaitront ici des que ton agence en recevra."}
          </p>
        </div>
      )}

      {colis.length > 0 && (
        <div className="space-y-2" style={{ opacity: isFetching ? 0.6 : 1, transition: "opacity 150ms" }}>
          {colis.map((c) => (
            <CarteColis key={c.id} colis={c} ouvrir={() => setOuvert(c.id)} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between gap-3 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg"
            style={{
              padding: "10px 16px",
              border: `1px solid ${C.border}`,
              backgroundColor: C.white,
              color: page <= 1 ? C.taupeLight : C.emerald,
              fontSize: "13px",
              fontWeight: 600,
              cursor: page <= 1 ? "not-allowed" : "pointer",
              minHeight: "44px",
            }}
          >
            Precedent
          </button>
          <span style={{ fontSize: "12.5px", color: C.taupe }}>
            Page {page} sur {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="rounded-lg"
            style={{
              padding: "10px 16px",
              border: `1px solid ${C.border}`,
              backgroundColor: C.white,
              color: page >= pages ? C.taupeLight : C.emerald,
              fontSize: "13px",
              fontWeight: 600,
              cursor: page >= pages ? "not-allowed" : "pointer",
              minHeight: "44px",
            }}
          >
            Suivant
          </button>
        </div>
      )}

      <ColisPanel colisId={ouvert} fermer={() => setOuvert(null)} />
    </div>
  );
}
