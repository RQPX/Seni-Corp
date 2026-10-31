// ============================================================
// Chauffeurs
//
// Un chauffeur, c'est un compte de connexion plus un profil de conduite
// (le permis). Le dispatch les cree ensemble, en une seule operation
// cote serveur (POST /chauffeurs/avec-compte) : si le permis est refuse,
// le compte n'est pas cree non plus. Le serveur fixe lui-meme le role.
// ============================================================

"use client";

import { useState } from "react";
import { CreditCard, Phone, AlertTriangle, Plus, Check } from "lucide-react";
import type { Chauffeur } from "@/lib/api";
import { useChauffeurs, useModifierChauffeur, useCreerChauffeurAvecCompte } from "@/lib/queries";
import { ChampsCompte, IDENTITE_VIDE, identiteValide, identitePourEnvoi, type Identite } from "@/components/ChampsCompte";
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

const demain = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

function FormulaireChauffeur({ fermer, cree }: { fermer: () => void; cree: (c: Chauffeur) => void }) {
  const mutation = useCreerChauffeurAvecCompte();
  const [identite, setIdentite] = useState<Identite>(IDENTITE_VIDE);
  const [permis, setPermis] = useState("");
  const [expiration, setExpiration] = useState("");

  const permisValide = /^[A-Z0-9-]{4,30}$/.test(permis);
  const valide = identiteValide(identite) && permisValide && expiration !== "" && expiration >= demain();

  const envoyer = () => {
    mutation.mutate(
      { ...identitePourEnvoi(identite), numeroPermis: permis, permisExpireLe: expiration },
      { onSuccess: (c) => { cree(c); fermer(); } },
    );
  };

  return (
    <Carte style={{ marginBottom: "16px", backgroundColor: C.ivory }}>
      <div className="space-y-4">
        <ChampsCompte valeur={identite} changer={setIdentite} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ borderTop: `1px solid ${C.border}`, paddingTop: "16px" }}>
          <Champ label="Numero de permis" aide="Lettres, chiffres et tirets.">
            <input
              value={permis}
              onChange={(e) => setPermis(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 30))}
              autoComplete="off"
              style={{ ...styleSaisie, fontFamily: "var(--font-mono)" }}
            />
          </Champ>
          <Champ label="Permis valable jusqu'au">
            <input type="date" value={expiration} min={demain()} onChange={(e) => setExpiration(e.target.value)} style={styleSaisie} />
          </Champ>
        </div>

        <Erreur erreur={mutation.error} />

        <div className="flex gap-2">
          <Bouton onClick={envoyer} disabled={!valide || mutation.isPending}>
            {mutation.isPending ? "Creation" : "Creer le chauffeur"}
          </Bouton>
          <Bouton variante="secondaire" onClick={fermer}>Annuler</Bouton>
        </div>
      </div>
    </Carte>
  );
}

/** Confirmation apres creation, avec les coordonnees telles que le serveur les a enregistrees. */
function ChauffeurCree({ chauffeur, fermer }: { chauffeur: Chauffeur; fermer: () => void }) {
  return (
    <div role="status" className="rounded-xl mb-4" style={{ backgroundColor: C.emeraldSoft, padding: "14px 16px" }}>
      <div className="flex items-start gap-2">
        <Check size={16} style={{ color: C.emerald, marginTop: "2px", flexShrink: 0 }} />
        <div className="flex-1 min-w-0" style={{ fontSize: "13px", color: C.anthracite, lineHeight: 1.6 }}>
          <strong>{chauffeur.user.prenom} {chauffeur.user.nom}</strong> peut maintenant se connecter avec
          l&apos;email <span style={{ fontFamily: "var(--font-mono)" }}>{chauffeur.user.email}</span> et le mot
          de passe que tu as choisi. Transmets-les lui directement.
          <div style={{ color: C.taupe, fontSize: "12px" }}>Telephone enregistre : {chauffeur.user.telephone}</div>
        </div>
        <button onClick={fermer} aria-label="Fermer le message" style={{ background: "none", border: "none", color: C.taupe, cursor: "pointer", minWidth: "32px", minHeight: "32px" }}>
          {"×"}
        </button>
      </div>
    </div>
  );
}

function ContenuChauffeurs() {
  const { data, isLoading, error } = useChauffeurs();
  const chauffeurs = data?.elements ?? [];
  const actifs = chauffeurs.filter((c) => c.actif).length;
  const [formulaire, setFormulaire] = useState(false);
  const [dernier, setDernier] = useState<Chauffeur | null>(null);

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: "860px" }} className="md:px-8">
      <EnTetePage
        titre="Chauffeurs"
        soustitre={isLoading ? "Chargement" : `${chauffeurs.length} profils, ${actifs} actifs`}
        action={!formulaire ? (
          <Bouton onClick={() => { setFormulaire(true); setDernier(null); }}><Plus size={15} /> Chauffeur</Bouton>
        ) : undefined}
      />

      {dernier && <ChauffeurCree chauffeur={dernier} fermer={() => setDernier(null)} />}
      {formulaire && <FormulaireChauffeur fermer={() => setFormulaire(false)} cree={setDernier} />}

      <Erreur erreur={error} repli="La liste des chauffeurs n'a pas pu etre chargee." />
      {isLoading && <Chargement texte="Chargement des chauffeurs" />}

      {!isLoading && !error && chauffeurs.length === 0 && !formulaire && (
        <Vide
          titre="Aucun chauffeur"
          texte="Cree un chauffeur avec son permis. Il pourra ensuite se connecter et etre affecte a des tournees."
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
