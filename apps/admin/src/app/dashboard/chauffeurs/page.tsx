// ============================================================
// Chauffeurs
//
// Un chauffeur est un profil de conduite pose sur un compte existant :
// le compte, son mot de passe et sa politique viennent du module users.
// Cet ecran gere donc le permis et l'activite, pas la creation de
// comptes, qui n'aurait pas les memes regles si elle passait par ici.
// ============================================================

"use client";

import { useState } from "react";
import { CreditCard, Phone, AlertTriangle } from "lucide-react";
import type { Chauffeur } from "@/lib/api";
import { useChauffeurs, useModifierChauffeur } from "@/lib/queries";
import {
  EnTetePage, Carte, Bouton, Champ, styleSaisie, Erreur, Chargement, Vide, Pastille, ReserveAu,
} from "@/components/ui";
import { formatDateFr } from "@/lib/utils";
import { C } from "@/lib/tokens";

/** Jours restants avant expiration du permis. Negatif si deja expire. */
function joursAvant(iso: string): number {
  const fin = new Date(iso).getTime();
  if (Number.isNaN(fin)) return 0;
  return Math.ceil((fin - Date.now()) / 86_400_000);
}

function LigneChauffeur({ chauffeur }: { chauffeur: Chauffeur }) {
  const mutation = useModifierChauffeur();
  const [edition, setEdition] = useState(false);
  const [permis, setPermis] = useState(chauffeur.numeroPermis);
  const [expire, setExpire] = useState(chauffeur.permisExpireLe.slice(0, 10));

  const jours = joursAvant(chauffeur.permisExpireLe);
  const expireBientot = jours >= 0 && jours <= 30;

  const enregistrer = () => {
    mutation.mutate(
      { id: chauffeur.id, numeroPermis: permis.trim().toUpperCase(), permisExpireLe: expire },
      { onSuccess: () => setEdition(false) },
    );
  };

  return (
    <Carte>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: "14px", fontWeight: 600, color: C.anthracite }}>
              {chauffeur.user.prenom} {chauffeur.user.nom}
            </span>
            {!chauffeur.actif && <Pastille texte="Inactif" fond={C.sage} couleur={C.taupe} />}
            {jours < 0 && <Pastille texte="Permis expire" fond={C.terraSoft} couleur={C.error} />}
            {expireBientot && <Pastille texte={`Permis a renouveler`} fond={C.warningSoft} couleur={C.warning} />}
          </div>

          <div className="flex items-center gap-1.5" style={{ fontSize: "12.5px", color: C.taupe, marginTop: "6px" }}>
            <CreditCard size={13} style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-mono)" }}>{chauffeur.numeroPermis}</span>
            <span>valable jusqu&apos;au {formatDateFr(chauffeur.permisExpireLe)}</span>
          </div>

          <div className="flex items-center gap-1.5" style={{ fontSize: "12.5px", color: C.taupe, marginTop: "3px" }}>
            <Phone size={13} style={{ flexShrink: 0 }} />
            {chauffeur.user.telephone}
          </div>
        </div>

        <div className="flex gap-2">
          {!edition && (
            <>
              <Bouton variante="secondaire" onClick={() => setEdition(true)}>Modifier</Bouton>
              <Bouton
                variante={chauffeur.actif ? "danger" : "principal"}
                onClick={() => mutation.mutate({ id: chauffeur.id, actif: !chauffeur.actif })}
                disabled={mutation.isPending}
              >
                {chauffeur.actif ? "Desactiver" : "Reactiver"}
              </Bouton>
            </>
          )}
        </div>
      </div>

      {jours < 0 && (
        <p className="flex items-start gap-2" style={{ fontSize: "11.5px", color: C.error, marginTop: "10px", lineHeight: 1.5 }}>
          <AlertTriangle size={13} style={{ marginTop: "1px", flexShrink: 0 }} />
          Le backend refusera d&apos;affecter ce chauffeur a une tournee tant que
          le permis n&apos;est pas a jour.
        </p>
      )}

      {edition && (
        <div className="mt-4 space-y-4" style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Champ label="Numero de permis" aide="Lettres, chiffres et tirets.">
              <input
                value={permis}
                onChange={(e) => setPermis(e.target.value.toUpperCase().slice(0, 30))}
                style={{ ...styleSaisie, fontFamily: "var(--font-mono)" }}
              />
            </Champ>
            <Champ label="Valable jusqu'au">
              <input type="date" value={expire} onChange={(e) => setExpire(e.target.value)} style={styleSaisie} />
            </Champ>
          </div>

          <Erreur erreur={mutation.error} />

          <div className="flex gap-2">
            <Bouton onClick={enregistrer} disabled={mutation.isPending || permis.trim().length < 4 || !expire}>
              {mutation.isPending ? "Enregistrement" : "Enregistrer"}
            </Bouton>
            <Bouton variante="secondaire" onClick={() => { setEdition(false); mutation.reset(); }}>
              Annuler
            </Bouton>
          </div>
        </div>
      )}

      {!edition && mutation.error && <div className="mt-2"><Erreur erreur={mutation.error} /></div>}
    </Carte>
  );
}

function ContenuChauffeurs() {
  const { data, isLoading, error } = useChauffeurs();
  const chauffeurs = data?.elements ?? [];
  const actifs = chauffeurs.filter((c) => c.actif).length;

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: "860px" }} className="md:px-8">
      <EnTetePage
        titre="Chauffeurs"
        soustitre={isLoading ? "Chargement" : `${chauffeurs.length} profils, ${actifs} actifs`}
      />

      <Erreur erreur={error} repli="La liste des chauffeurs n'a pas pu etre chargee." />
      {isLoading && <Chargement texte="Chargement des chauffeurs" />}

      {!isLoading && !error && chauffeurs.length === 0 && (
        <Vide
          titre="Aucun profil de chauffeur"
          texte="Un profil se pose sur un compte deja cree. Cree d'abord le compte avec le role chauffeur, puis rattache-lui son permis."
        />
      )}

      {chauffeurs.length > 0 && (
        <div className="space-y-2">
          {chauffeurs.map((c) => <LigneChauffeur key={c.id} chauffeur={c} />)}
        </div>
      )}
    </div>
  );
}

export default function PageChauffeurs() {
  return (
    <ReserveAu roles={["DISPATCHER", "ADMIN"]}>
      <ContenuChauffeurs />
    </ReserveAu>
  );
}
