// ============================================================
// Tournees
//
// Une tournee est une occurrence datee d'une ligne, avec un camion et
// un chauffeur. Son manifeste ne se compose que tant qu'elle est
// planifiee ; au depart, chaque colis passe EN_TRANSIT par la machine a
// etats, et ceux qu'elle refuse sont remontes au lieu d'etre embarques
// en silence.
// ============================================================

"use client";

import { useState } from "react";
import { Plus, ChevronRight, ArrowRight } from "lucide-react";
import type { StatutTournee, TourneeResume } from "@/lib/api";
import {
  useTournees, useMesTournees, useUtilisateur, useLignes, useCamions, useChauffeurs, useCreerTournee,
} from "@/lib/queries";
import {
  EnTetePage, Carte, Bouton, Champ, styleSaisie, Erreur, Chargement, Vide, Pastille,
} from "@/components/ui";
import { TourneePanel } from "@/components/TourneePanel";
import { statutTourneeConfig } from "@/lib/statuts";
import { formatDateFr } from "@/lib/utils";
import { C } from "@/lib/tokens";

const FILTRES: { valeur: StatutTournee | ""; label: string }[] = [
  { valeur: "", label: "Toutes" },
  { valeur: "PLANIFIEE", label: "Planifiees" },
  { valeur: "EN_COURS", label: "En cours" },
  { valeur: "TERMINEE", label: "Terminees" },
  { valeur: "ANNULEE", label: "Annulees" },
];

function CarteTournee({ tournee, ouvrir }: { tournee: TourneeResume; ouvrir: () => void }) {
  const apparence = statutTourneeConfig(tournee.statut);

  return (
    <Carte onClick={ouvrir}>
      <div className="flex items-center gap-3">
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: C.anthracite }}>
              {tournee.reference}
            </span>
            <Pastille texte={apparence.label} fond={apparence.bg} couleur={apparence.color} />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: "13px", color: C.anthracite, marginTop: "5px" }}>
            <span>{tournee.ligne.origine.ville}</span>
            <ArrowRight size={12} style={{ flexShrink: 0, color: C.taupeLight }} />
            <span>{tournee.ligne.destination.ville}</span>
          </div>

          <div style={{ fontSize: "11.5px", color: C.taupe, marginTop: "4px" }}>
            {formatDateFr(tournee.datePrevue)}
            {" · "}
            {tournee.camion.immatriculation}
            {" · "}
            {tournee.chauffeur.user.prenom} {tournee.chauffeur.user.nom}
            {" · "}
            {tournee._count.colis} colis
          </div>
        </div>
        <ChevronRight size={18} style={{ color: C.taupeLight, flexShrink: 0 }} aria-hidden="true" />
      </div>
    </Carte>
  );
}

function FormulaireTournee({ fermer }: { fermer: () => void }) {
  const mutation = useCreerTournee();
  const { data: lignes } = useLignes();
  const { data: camions } = useCamions();
  const { data: chauffeurs } = useChauffeurs();

  const [ligneId, setLigneId] = useState("");
  const [camionId, setCamionId] = useState("");
  const [chauffeurId, setChauffeurId] = useState("");
  const [date, setDate] = useState("");

  // On ne propose que ce qui est affectable. Le backend refuse de toute
  // facon un camion en maintenance ou un permis expire : autant ne pas
  // conduire le dispatcher vers un refus.
  const lignesActives = (lignes?.elements ?? []).filter((l) => l.actif);
  const camionsLibres = (camions?.elements ?? []).filter((c) => c.actif && c.statut === "DISPONIBLE");
  const chauffeursActifs = (chauffeurs?.elements ?? []).filter((c) => c.actif && c.user.actif);

  const valide = ligneId !== "" && camionId !== "" && chauffeurId !== "" && date !== "";

  const envoyer = () => {
    mutation.mutate(
      {
        ligneId: Number(ligneId),
        camionId: Number(camionId),
        chauffeurId: Number(chauffeurId),
        // Le backend attend une date ISO. Un champ date rend "2026-10-20".
        datePrevue: new Date(`${date}T08:00:00`).toISOString(),
      },
      { onSuccess: fermer },
    );
  };

  return (
    <Carte style={{ marginBottom: "16px", backgroundColor: C.ivory }}>
      <div className="space-y-4">
        <Champ label="Ligne">
          <select value={ligneId} onChange={(e) => setLigneId(e.target.value)} style={styleSaisie}>
            <option value="">Choisir une ligne</option>
            {lignesActives.map((l) => (
              <option key={l.id} value={l.id}>
                {l.libelle} ({l.origine.ville} vers {l.destination.ville})
              </option>
            ))}
          </select>
        </Champ>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Champ
            label="Camion"
            aide={camionsLibres.length === 0 ? "Aucun camion disponible pour le moment." : undefined}
          >
            <select value={camionId} onChange={(e) => setCamionId(e.target.value)} style={styleSaisie}>
              <option value="">Choisir un camion</option>
              {camionsLibres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.immatriculation} ({c.capaciteKg.toLocaleString("fr-FR")} kg)
                </option>
              ))}
            </select>
          </Champ>

          <Champ
            label="Chauffeur"
            aide={chauffeursActifs.length === 0 ? "Aucun chauffeur actif pour le moment." : undefined}
          >
            <select value={chauffeurId} onChange={(e) => setChauffeurId(e.target.value)} style={styleSaisie}>
              <option value="">Choisir un chauffeur</option>
              {chauffeursActifs.map((c) => (
                <option key={c.id} value={c.id}>{c.user.prenom} {c.user.nom}</option>
              ))}
            </select>
          </Champ>
        </div>

        <Champ label="Date prevue" aide="Le camion et le chauffeur ne peuvent pas etre engages deux fois le meme jour.">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styleSaisie} />
        </Champ>

        <Erreur erreur={mutation.error} />

        <div className="flex gap-2">
          <Bouton onClick={envoyer} disabled={!valide || mutation.isPending}>
            {mutation.isPending ? "Enregistrement" : "Planifier"}
          </Bouton>
          <Bouton variante="secondaire" onClick={fermer}>Annuler</Bouton>
        </div>
      </div>
    </Carte>
  );
}

export default function PageTournees() {
  const { data: user } = useUtilisateur();
  const [statut, setStatut] = useState<StatutTournee | "">("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouverte, setOuverte] = useState<number | null>(null);

  const estChauffeur = user?.role === "CHAUFFEUR";
  const peutPlanifier = user?.role === "DISPATCHER" || user?.role === "ADMIN";

  // Un chauffeur travaille sur SES tournees. Il peut voir celles du
  // reseau, mais ce n'est pas sa vue par defaut.
  const [miennes, setMiennes] = useState(true);
  const vueMiennes = estChauffeur && miennes;

  // Chaque vue a sa requete, et seule celle qui est affichee part :
  // `mes-tournees` est refuse a un dispatcher, et `tournees` serait un
  // appel inutile pour un chauffeur qui regarde les siennes.
  const reseau = useTournees(statut || undefined, !vueMiennes);
  const perso = useMesTournees(statut || undefined, vueMiennes);
  const { data, isLoading, error } = vueMiennes ? perso : reseau;

  const tournees = data?.elements ?? [];

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: "900px" }} className="md:px-8">
      <EnTetePage
        titre="Tournees"
        soustitre={isLoading ? "Chargement" : `${tournees.length} tournees`}
        action={
          peutPlanifier && !formulaire ? (
            <Bouton onClick={() => setFormulaire(true)}>
              <Plus size={15} /> Planifier
            </Bouton>
          ) : undefined
        }
      />

      {formulaire && <FormulaireTournee fermer={() => setFormulaire(false)} />}

      <div className="flex flex-wrap gap-2 mb-4">
        {estChauffeur && (
          <div className="flex gap-1 rounded-lg mr-2" style={{ border: `1px solid ${C.border}`, padding: "3px", backgroundColor: C.white }}>
            {[{ v: true, l: "Mes tournees" }, { v: false, l: "Le reseau" }].map((o) => (
              <button
                key={String(o.v)}
                onClick={() => setMiennes(o.v)}
                aria-pressed={miennes === o.v}
                className="rounded-md"
                style={{
                  padding: "7px 12px", border: "none", cursor: "pointer",
                  backgroundColor: miennes === o.v ? C.emerald : "transparent",
                  color: miennes === o.v ? C.white : C.taupe,
                  fontSize: "12px", fontWeight: 600, minHeight: "34px",
                }}
              >
                {o.l}
              </button>
            ))}
          </div>
        )}

        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value as StatutTournee | "")}
          aria-label="Filtrer par statut de tournee"
          style={{ ...styleSaisie, width: "auto", minWidth: "160px" }}
        >
          {FILTRES.map((f) => <option key={f.valeur} value={f.valeur}>{f.label}</option>)}
        </select>
      </div>

      <Erreur erreur={error} repli="Les tournees n'ont pas pu etre chargees." />
      {isLoading && <Chargement texte="Chargement des tournees" />}

      {!isLoading && !error && tournees.length === 0 && !formulaire && (
        <Vide
          titre="Aucune tournee"
          texte={
            vueMiennes
              ? "Aucune tournee ne t'est affectee pour le moment."
              : peutPlanifier
                ? "Planifie une tournee sur une ligne existante, avec un camion disponible et un chauffeur actif."
                : "Les tournees planifiees apparaitront ici."
          }
        />
      )}

      {tournees.length > 0 && (
        <div className="space-y-2">
          {tournees.map((t) => (
            <CarteTournee key={t.id} tournee={t} ouvrir={() => setOuverte(t.id)} />
          ))}
        </div>
      )}

      <TourneePanel tourneeId={ouverte} fermer={() => setOuverte(null)} />
    </div>
  );
}
