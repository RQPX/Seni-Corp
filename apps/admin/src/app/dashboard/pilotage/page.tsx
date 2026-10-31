// ============================================================
// Pilotage
//
// Vue d'ensemble du reseau pour le CEO et les superviseurs (role
// DISPATCHER). Un seul appel a GET /statistiques/reseau alimente tout
// l'ecran. Le backend refuse la route aux autres roles, la garde
// d'interface evite seulement d'afficher une page qui finirait en 403.
//
// La Cote d'Ivoire est a UTC+0 toute l'annee : les dates du jour se
// calculent en UTC, comme cote serveur.
// ============================================================

"use client";

import { useState } from "react";
import { useStatistiquesReseau } from "@/lib/queries";
import { EnTetePage, Erreur, Chargement, ReserveAu, styleSaisie } from "@/components/ui";
import { TableauPilotage } from "@/components/pilotage/TableauPilotage";
import { jourLong } from "@/components/pilotage/format";
import { C } from "@/lib/tokens";

const JOUR_MS = 86_400_000;
const ETENDUE_MAX = 366;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const aujourdhui = () => iso(new Date());
const ilYA = (jours: number) => iso(new Date(Date.now() - jours * JOUR_MS));

/** Periodes toutes faites. `jours` inclut aujourd'hui. */
const RACCOURCIS = [
  { cle: "7", libelle: "7 jours", jours: 7 },
  { cle: "30", libelle: "30 jours", jours: 30 },
  { cle: "90", libelle: "90 jours", jours: 90 },
  { cle: "365", libelle: "12 mois", jours: 365 },
] as const;

function etendue(depuis: string, jusqua: string): number {
  return Math.round((Date.parse(jusqua) - Date.parse(depuis)) / JOUR_MS) + 1;
}

function ContenuPilotage() {
  const [depuis, setDepuis] = useState(() => ilYA(29));
  const [jusqua, setJusqua] = useState(aujourdhui);
  const [raccourci, setRaccourci] = useState<string>("30");

  // Les dates saisies a la main ne partent au serveur que si elles sont
  // coherentes. Sinon on le dit tout de suite, sans aller-retour.
  const nbJours = depuis && jusqua ? etendue(depuis, jusqua) : 0;
  const probleme =
    !depuis || !jusqua ? "Choisis une date de debut et une date de fin."
    : nbJours < 1 ? "La date de fin doit etre posterieure ou egale a la date de debut."
    : nbJours > ETENDUE_MAX ? `La periode ne peut pas depasser ${ETENDUE_MAX} jours.`
    : null;

  const { data, isLoading, error, isPlaceholderData, isFetching } = useStatistiquesReseau(
    probleme ? "" : depuis,
    probleme ? "" : jusqua,
  );
  const pret = !probleme;

  const choisirRaccourci = (cle: string, jours: number) => {
    setRaccourci(cle);
    setDepuis(ilYA(jours - 1));
    setJusqua(aujourdhui());
  };

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: "1120px" }} className="md:px-8">
      <EnTetePage
        titre="Pilotage"
        soustitre={pret ? `Activite du ${jourLong(depuis)} au ${jourLong(jusqua)}` : "Choisis une periode"}
      />

      {/* Choix de la periode, sur une seule ligne au-dessus de tout le reste */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Periode">
          {RACCOURCIS.map((r) => {
            const actif = raccourci === r.cle;
            return (
              <button
                key={r.cle}
                type="button"
                onClick={() => choisirRaccourci(r.cle, r.jours)}
                aria-pressed={actif}
                className="rounded-lg"
                style={{
                  padding: "8px 12px", minHeight: "40px",
                  border: `1px solid ${actif ? C.emerald : C.border}`,
                  backgroundColor: actif ? C.emerald : C.white,
                  color: actif ? C.white : C.taupe,
                  fontSize: "12.5px", fontWeight: 600, cursor: "pointer",
                }}
              >
                {r.libelle}
              </button>
            );
          })}
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <label style={{ fontSize: "11.5px", color: C.taupe }}>
            Du
            <input
              type="date" value={depuis} max={jusqua || undefined}
              onChange={(e) => { setDepuis(e.target.value); setRaccourci(""); }}
              style={{ ...styleSaisie, display: "block", marginTop: "4px", width: "auto" }}
            />
          </label>
          <label style={{ fontSize: "11.5px", color: C.taupe }}>
            Au
            <input
              type="date" value={jusqua} min={depuis || undefined}
              onChange={(e) => { setJusqua(e.target.value); setRaccourci(""); }}
              style={{ ...styleSaisie, display: "block", marginTop: "4px", width: "auto" }}
            />
          </label>
        </div>
      </div>

      {probleme && (
        <p role="alert" style={{ fontSize: "12.5px", color: C.error, marginBottom: "16px" }}>{probleme}</p>
      )}

      {pret && (
        <>
          <Erreur erreur={error} repli="Les chiffres n'ont pas pu etre charges." />
          {isLoading && <Chargement texte="Calcul des indicateurs" />}
          {data && (
            <div
              aria-busy={isFetching}
              style={{ opacity: isPlaceholderData ? 0.55 : 1, transition: "opacity 150ms" }}
            >
              <TableauPilotage stats={data} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PagePilotage() {
  return (
    <ReserveAu roles={["DISPATCHER", "ADMIN"]}>
      <ContenuPilotage />
    </ReserveAu>
  );
}
