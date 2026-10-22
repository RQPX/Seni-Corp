// ============================================================
// Lignes regulieres
//
// Une ligne est un trajet desservi. Les tournees en sont les
// occurrences datees : la ligne dit « Abidjan vers Bouake en 5 h », la
// tournee dit « le 3 octobre, avec ce camion et ce chauffeur ».
//
// L'origine et la destination ne sont pas modifiables : elles sont
// l'identite de la ligne dans l'historique des tournees. Un autre
// trajet est une autre ligne.
// ============================================================

"use client";

import { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { DUREE_MAX_MIN, type Ligne } from "@/lib/api";
import { useLignes, useCreerLigne, useModifierLigne, usePointsRelais } from "@/lib/queries";
import {
  EnTetePage, Carte, Bouton, Champ, styleSaisie, Erreur, Chargement, Vide, Pastille, ReserveAu,
} from "@/components/ui";
import { C } from "@/lib/tokens";

// Convention ISO du backend : 1 = lundi ... 7 = dimanche.
const JOURS = [
  { numero: 1, court: "Lun" }, { numero: 2, court: "Mar" }, { numero: 3, court: "Mer" },
  { numero: 4, court: "Jeu" }, { numero: 5, court: "Ven" }, { numero: 6, court: "Sam" },
  { numero: 7, court: "Dim" },
];

function dureeLisible(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

function ChoixJours({ choisis, basculer }: { choisis: number[]; basculer: (n: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {JOURS.map((jour) => {
        const actif = choisis.includes(jour.numero);
        return (
          <button
            key={jour.numero}
            type="button"
            onClick={() => basculer(jour.numero)}
            aria-pressed={actif}
            className="rounded-lg"
            style={{
              padding: "8px 11px",
              minHeight: "40px",
              minWidth: "48px",
              border: `1px solid ${actif ? C.emerald : C.border}`,
              backgroundColor: actif ? C.emerald : C.white,
              color: actif ? C.white : C.taupe,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {jour.court}
          </button>
        );
      })}
    </div>
  );
}

function LigneCarte({ ligne }: { ligne: Ligne }) {
  const mutation = useModifierLigne();
  const [edition, setEdition] = useState(false);
  const [libelle, setLibelle] = useState(ligne.libelle);
  const [jours, setJours] = useState<number[]>(ligne.joursDesserte);
  const [duree, setDuree] = useState(String(ligne.dureeEstimeeMin));

  const dureeNb = Number(duree);
  const valide = libelle.trim().length >= 3 && dureeNb > 0 && dureeNb <= DUREE_MAX_MIN;

  const enregistrer = () => {
    mutation.mutate(
      { id: ligne.id, libelle: libelle.trim(), joursDesserte: jours, dureeEstimeeMin: dureeNb },
      { onSuccess: () => setEdition(false) },
    );
  };

  const dessertes = [...ligne.joursDesserte].sort((a, b) => a - b);

  return (
    <Carte>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: "14px", fontWeight: 600, color: C.anthracite }}>{ligne.libelle}</span>
            {!ligne.actif && <Pastille texte="Desactivee" fond={C.sage} couleur={C.taupe} />}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: "12.5px", color: C.taupe, marginTop: "6px" }}>
            <span>{ligne.origine.nom}</span>
            <ArrowRight size={13} style={{ flexShrink: 0 }} />
            <span>{ligne.destination.nom}</span>
            <span>{"·"} {dureeLisible(ligne.dureeEstimeeMin)}</span>
          </div>

          <div style={{ fontSize: "12px", color: C.taupe, marginTop: "4px" }}>
            {dessertes.length === 0
              ? "A la demande, sans jour fixe"
              : "Desservie le " + dessertes.map((n) => JOURS[n - 1].court.toLowerCase()).join(", ")}
          </div>
        </div>

        {!edition && (
          <div className="flex gap-2">
            <Bouton variante="secondaire" onClick={() => setEdition(true)}>Modifier</Bouton>
            <Bouton
              variante={ligne.actif ? "danger" : "principal"}
              onClick={() => mutation.mutate({ id: ligne.id, actif: !ligne.actif })}
              disabled={mutation.isPending}
            >
              {ligne.actif ? "Desactiver" : "Reactiver"}
            </Bouton>
          </div>
        )}
      </div>

      {edition && (
        <div className="mt-4 space-y-4" style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px" }}>
          <Champ label="Libelle">
            <input value={libelle} onChange={(e) => setLibelle(e.target.value.slice(0, 80))} style={styleSaisie} />
          </Champ>

          <Champ label="Jours de desserte" aide="Aucun jour coche veut dire a la demande.">
            <ChoixJours
              choisis={jours}
              basculer={(n) => setJours((j) => (j.includes(n) ? j.filter((x) => x !== n) : [...j, n]))}
            />
          </Champ>

          <Champ label="Duree estimee en minutes" aide={`Au plus ${DUREE_MAX_MIN} minutes, soit 24 h.`}>
            <input
              value={duree}
              onChange={(e) => setDuree(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              style={{ ...styleSaisie, fontFamily: "var(--font-mono)" }}
            />
          </Champ>

          <Erreur erreur={mutation.error} />

          <div className="flex gap-2">
            <Bouton onClick={enregistrer} disabled={!valide || mutation.isPending}>
              {mutation.isPending ? "Enregistrement" : "Enregistrer"}
            </Bouton>
            <Bouton variante="secondaire" onClick={() => { setEdition(false); mutation.reset(); }}>Annuler</Bouton>
          </div>
        </div>
      )}

      {!edition && mutation.error && <div className="mt-2"><Erreur erreur={mutation.error} /></div>}
    </Carte>
  );
}

function FormulaireLigne({ fermer }: { fermer: () => void }) {
  const mutation = useCreerLigne();
  const { data: points } = usePointsRelais();
  const [libelle, setLibelle] = useState("");
  const [origineId, setOrigineId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [jours, setJours] = useState<number[]>([]);
  const [duree, setDuree] = useState("");

  const dureeNb = Number(duree);
  const memePoint = origineId !== "" && origineId === destinationId;
  const valide =
    libelle.trim().length >= 3 && origineId !== "" && destinationId !== "" &&
    !memePoint && dureeNb > 0 && dureeNb <= DUREE_MAX_MIN;

  const envoyer = () => {
    mutation.mutate(
      {
        libelle: libelle.trim(),
        origineId: Number(origineId),
        destinationId: Number(destinationId),
        joursDesserte: jours,
        dureeEstimeeMin: dureeNb,
      },
      { onSuccess: fermer },
    );
  };

  // L'endpoint public ne renvoie que les points actifs et n'expose meme
  // pas le champ : inutile de refiltrer ici.
  const actifs = points ?? [];

  return (
    <Carte style={{ marginBottom: "16px", backgroundColor: C.ivory }}>
      <div className="space-y-4">
        <Champ label="Libelle" aide="Entre 3 et 80 caracteres. Exemple : Abidjan vers Bouake.">
          <input value={libelle} onChange={(e) => setLibelle(e.target.value.slice(0, 80))} style={styleSaisie} />
        </Champ>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Champ label="Origine">
            <select value={origineId} onChange={(e) => setOrigineId(e.target.value)} style={styleSaisie}>
              <option value="">Choisir un point</option>
              {actifs.map((p) => <option key={p.id} value={p.id}>{p.nom} ({p.ville})</option>)}
            </select>
          </Champ>
          <Champ label="Destination">
            <select value={destinationId} onChange={(e) => setDestinationId(e.target.value)} style={styleSaisie}>
              <option value="">Choisir un point</option>
              {actifs.map((p) => <option key={p.id} value={p.id}>{p.nom} ({p.ville})</option>)}
            </select>
          </Champ>
        </div>

        {memePoint && (
          <p style={{ fontSize: "12px", color: C.error }}>
            L&apos;origine et la destination doivent etre deux points differents.
          </p>
        )}

        <Champ label="Jours de desserte" aide="Aucun jour coche veut dire a la demande.">
          <ChoixJours
            choisis={jours}
            basculer={(n) => setJours((j) => (j.includes(n) ? j.filter((x) => x !== n) : [...j, n]))}
          />
        </Champ>

        <Champ label="Duree estimee en minutes" aide={`Au plus ${DUREE_MAX_MIN} minutes, soit 24 h.`}>
          <input
            value={duree}
            onChange={(e) => setDuree(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="300"
            style={{ ...styleSaisie, fontFamily: "var(--font-mono)" }}
          />
        </Champ>

        <Erreur erreur={mutation.error} />

        <div className="flex gap-2">
          <Bouton onClick={envoyer} disabled={!valide || mutation.isPending}>
            {mutation.isPending ? "Enregistrement" : "Creer la ligne"}
          </Bouton>
          <Bouton variante="secondaire" onClick={fermer}>Annuler</Bouton>
        </div>
      </div>
    </Carte>
  );
}

function ContenuLignes() {
  const { data, isLoading, error } = useLignes();
  const [formulaire, setFormulaire] = useState(false);

  const lignes = data?.elements ?? [];
  const actives = lignes.filter((l) => l.actif).length;

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: "860px" }} className="md:px-8">
      <EnTetePage
        titre="Lignes"
        soustitre={isLoading ? "Chargement" : `${lignes.length} lignes, ${actives} actives`}
        action={!formulaire ? <Bouton onClick={() => setFormulaire(true)}><Plus size={15} /> Ligne</Bouton> : undefined}
      />

      {formulaire && <FormulaireLigne fermer={() => setFormulaire(false)} />}

      <Erreur erreur={error} repli="Les lignes n'ont pas pu etre chargees." />
      {isLoading && <Chargement texte="Chargement des lignes" />}

      {!isLoading && !error && lignes.length === 0 && !formulaire && (
        <Vide
          titre="Aucune ligne"
          texte="Une tournee se planifie sur une ligne. Cree le trajet une fois, puis planifie autant de tournees que necessaire."
        />
      )}

      {lignes.length > 0 && (
        <div className="space-y-2">
          {lignes.map((l) => <LigneCarte key={l.id} ligne={l} />)}
        </div>
      )}
    </div>
  );
}

export default function PageLignes() {
  return (
    <ReserveAu roles={["DISPATCHER", "ADMIN"]}>
      <ContenuLignes />
    </ReserveAu>
  );
}
