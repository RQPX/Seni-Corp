// ============================================================
// Flotte
//
// EN_TOURNEE ne se pose jamais a la main : ce statut decoule d'une
// tournee demarree, et le backend le refuse en saisie directe. Le menu
// ne le propose donc pas.
// ============================================================

"use client";

import { useState } from "react";
import { Plus, Truck } from "lucide-react";
import { CAPACITE_MAX_KG, type Camion, type StatutCamion } from "@/lib/api";
import { statutCamionConfig, STATUTS_CAMION } from "@/lib/statuts";
import { useCamions, useCreerCamion, useChangerStatutCamion } from "@/lib/queries";
import {
  EnTetePage, Carte, Bouton, Champ, styleSaisie, Erreur, Chargement, Vide, Pastille, ReserveAu,
} from "@/components/ui";
import { C } from "@/lib/tokens";

/** Statuts qu'un humain peut poser. EN_TOURNEE est exclu, voir l'en-tete. */
const POSABLES: StatutCamion[] = ["DISPONIBLE", "MAINTENANCE", "HORS_SERVICE"];

function LigneCamion({ camion }: { camion: Camion }) {
  const mutation = useChangerStatutCamion();
  const apparence = statutCamionConfig(camion.statut);
  const enTournee = camion.statut === "EN_TOURNEE";

  return (
    <Carte>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600, color: C.anthracite, letterSpacing: "0.5px" }}>
              {camion.immatriculation}
            </span>
            <Pastille texte={apparence.label} fond={apparence.bg} couleur={apparence.color} />
            {!camion.actif && <Pastille texte="Retire" fond={C.sage} couleur={C.taupe} />}
          </div>
          <div style={{ fontSize: "12.5px", color: C.taupe, marginTop: "5px" }}>
            {[camion.marque, camion.modele].filter(Boolean).join(" ") || "Modele non renseigne"}
            {" · "}
            {camion.capaciteKg.toLocaleString("fr-FR")} kg
          </div>
        </div>

        <select
          value={camion.statut}
          disabled={enTournee || mutation.isPending}
          onChange={(e) => mutation.mutate({ id: camion.id, statut: e.target.value as StatutCamion })}
          aria-label={`Statut du camion ${camion.immatriculation}`}
          style={{ ...styleSaisie, width: "auto", minWidth: "150px", fontSize: "12.5px", cursor: enTournee ? "not-allowed" : "pointer" }}
        >
          {enTournee ? (
            <option value="EN_TOURNEE">En tournee</option>
          ) : (
            POSABLES.map((s) => (
              <option key={s} value={s}>{STATUTS_CAMION[s].label}</option>
            ))
          )}
        </select>
      </div>

      {enTournee && (
        <p style={{ fontSize: "11.5px", color: C.taupe, marginTop: "8px", lineHeight: 1.5 }}>
          Ce camion roule. Son statut changera a la fin de la tournee.
        </p>
      )}

      {mutation.error && <div className="mt-2"><Erreur erreur={mutation.error} /></div>}
    </Carte>
  );
}

function FormulaireCamion({ fermer }: { fermer: () => void }) {
  const mutation = useCreerCamion();
  const [immat, setImmat] = useState("");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [capacite, setCapacite] = useState("");

  const capaciteNb = Number(capacite);
  const valide =
    immat.trim().length >= 4 &&
    Number.isInteger(capaciteNb) &&
    capaciteNb > 0 &&
    capaciteNb <= CAPACITE_MAX_KG;

  const envoyer = () => {
    mutation.mutate(
      {
        immatriculation: immat.trim().toUpperCase(),
        ...(marque.trim() ? { marque: marque.trim() } : {}),
        ...(modele.trim() ? { modele: modele.trim() } : {}),
        capaciteKg: capaciteNb,
      },
      { onSuccess: fermer },
    );
  };

  return (
    <Carte style={{ marginBottom: "16px", backgroundColor: C.ivory }}>
      <div className="space-y-4">
        <Champ
          label="Immatriculation"
          aide="Lettres, chiffres, tirets et espaces. Elle doit etre unique dans la flotte."
        >
          <input
            value={immat}
            onChange={(e) => setImmat(e.target.value.toUpperCase().slice(0, 20))}
            placeholder="1234 AB 01"
            style={{ ...styleSaisie, fontFamily: "var(--font-mono)", letterSpacing: "1px" }}
          />
        </Champ>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Champ label="Marque">
            <input value={marque} onChange={(e) => setMarque(e.target.value.slice(0, 60))} placeholder="Facultatif" style={styleSaisie} />
          </Champ>
          <Champ label="Modele">
            <input value={modele} onChange={(e) => setModele(e.target.value.slice(0, 60))} placeholder="Facultatif" style={styleSaisie} />
          </Champ>
        </div>

        <Champ
          label="Capacite en kilogrammes"
          aide={`Un entier, au plus ${CAPACITE_MAX_KG.toLocaleString("fr-FR")} kg. C'est elle qui limite le chargement d'une tournee.`}
        >
          <input
            value={capacite}
            onChange={(e) => setCapacite(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="3500"
            style={{ ...styleSaisie, fontFamily: "var(--font-mono)" }}
          />
        </Champ>

        <Erreur erreur={mutation.error} />

        <div className="flex gap-2">
          <Bouton onClick={envoyer} disabled={!valide || mutation.isPending}>
            {mutation.isPending ? "Enregistrement" : "Ajouter le camion"}
          </Bouton>
          <Bouton variante="secondaire" onClick={fermer}>Annuler</Bouton>
        </div>
      </div>
    </Carte>
  );
}

function ContenuFlotte() {
  const { data, isLoading, error } = useCamions();
  const [formulaire, setFormulaire] = useState(false);

  const camions = data?.elements ?? [];
  const disponibles = camions.filter((c) => c.statut === "DISPONIBLE").length;

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: "860px" }} className="md:px-8">
      <EnTetePage
        titre="Flotte"
        soustitre={isLoading ? "Chargement" : `${camions.length} camions, ${disponibles} disponibles`}
        action={
          !formulaire ? (
            <Bouton onClick={() => setFormulaire(true)}>
              <Plus size={15} /> Camion
            </Bouton>
          ) : undefined
        }
      />

      {formulaire && <FormulaireCamion fermer={() => setFormulaire(false)} />}

      <Erreur erreur={error} repli="La flotte n'a pas pu etre chargee." />
      {isLoading && <Chargement texte="Chargement de la flotte" />}

      {!isLoading && !error && camions.length === 0 && !formulaire && (
        <Vide
          titre="Aucun camion enregistre"
          texte="Ajoute un camion pour pouvoir planifier des tournees. Une tournee exige un camion disponible."
        />
      )}

      {camions.length > 0 && (
        <div className="space-y-2">
          {camions.map((c) => <LigneCamion key={c.id} camion={c} />)}
        </div>
      )}

      {camions.length > 0 && (
        <p className="flex items-start gap-2" style={{ fontSize: "11.5px", color: C.taupe, marginTop: "18px", lineHeight: 1.6 }}>
          <Truck size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
          Un camion en maintenance ou hors service ne peut pas etre affecte a
          une tournee. Remets-le disponible quand il repart.
        </p>
      )}
    </div>
  );
}

export default function PageFlotte() {
  return (
    <ReserveAu roles={["DISPATCHER", "ADMIN"]}>
      <ContenuFlotte />
    </ReserveAu>
  );
}
