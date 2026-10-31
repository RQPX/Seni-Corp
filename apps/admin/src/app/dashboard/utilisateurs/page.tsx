// ============================================================
// Utilisateurs (administration uniquement)
//
// Liste les comptes et cree les comptes internes. POST /users est le
// seul chemin qui attribue un role autre que CLIENT : le choix du role
// est donc explicite, sans valeur par defaut, et un compte
// administrateur demande une confirmation.
//
// Ce que l'ecran ne propose volontairement pas :
// - creer un chauffeur : il lui faut aussi un permis, voir l'ecran
//   Chauffeurs ;
// - creer un client : les clients ouvrent leur compte eux-memes ;
// - changer le role d'un agent, d'un chauffeur ou d'un client : l'agence
//   ou le profil attache au compte ne suivrait pas. On cree un autre
//   compte. Seul le passage entre dispatch et administration est propose.
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Check, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import type { Utilisateur, RoleInterne } from "@/lib/api";
import type { Role } from "@/lib/statuts";
import {
  useUtilisateurs, useCreerUtilisateur, useModifierRoleUtilisateur, useDefinirActifUtilisateur,
  useUtilisateur, usePointsRelais,
} from "@/lib/queries";
import {
  EnTetePage, Carte, Bouton, Champ, styleSaisie, Erreur, Chargement, Vide, Pastille, ReserveAu,
} from "@/components/ui";
import { ChampsCompte, IDENTITE_VIDE, identiteValide, identitePourEnvoi, type Identite } from "@/components/ChampsCompte";
import { formatDateFr } from "@/lib/utils";
import { C } from "@/lib/tokens";

const LIBELLE_ROLE: Record<Role, string> = {
  AGENT: "Agent",
  CHAUFFEUR: "Chauffeur",
  DISPATCHER: "Dispatch",
  ADMIN: "Administrateur",
  CLIENT: "Client",
};

const CHOIX_ROLE: { role: RoleInterne; titre: string; texte: string }[] = [
  { role: "AGENT", titre: "Agent de guichet", texte: "Travaille dans une agence. Ne voit que les colis et tournees de son agence." },
  { role: "DISPATCHER", titre: "Dispatch", texte: "Planifie les tournees et suit tout le reseau, y compris le pilotage." },
  { role: "ADMIN", titre: "Administrateur", texte: "Tous les droits, y compris la creation de comptes et le changement de role." },
];

const PAR_PAGE = 20;

function PastilleRole({ role }: { role: Role }) {
  const fort = role === "ADMIN";
  return <Pastille texte={LIBELLE_ROLE[role]} fond={fort ? C.bronzeSoft : C.emeraldSoft} couleur={fort ? "#8B6F3D" : C.emerald} />;
}

// ------------------------------------------------------------
// Creation
// ------------------------------------------------------------

function FormulaireCompte({ fermer, cree }: { fermer: () => void; cree: (u: Utilisateur) => void }) {
  const mutation = useCreerUtilisateur();
  const { data: points } = usePointsRelais();
  const [role, setRole] = useState<RoleInterne | null>(null);
  const [agence, setAgence] = useState("");
  const [identite, setIdentite] = useState<Identite>(IDENTITE_VIDE);
  const [confirmeAdmin, setConfirmeAdmin] = useState(false);

  const valide =
    role !== null && identiteValide(identite) &&
    (role !== "AGENT" || agence !== "") &&
    (role !== "ADMIN" || confirmeAdmin);

  const envoyer = () => {
    if (!role) return;
    mutation.mutate(
      { ...identitePourEnvoi(identite), role, ...(role === "AGENT" ? { pointRelaisId: Number(agence) } : {}) },
      { onSuccess: (u) => { cree(u); fermer(); } },
    );
  };

  return (
    <Carte style={{ marginBottom: "16px", backgroundColor: C.ivory }}>
      <div className="space-y-4">
        <fieldset>
          <legend style={{ fontSize: "12px", fontWeight: 600, color: C.anthracite, marginBottom: "8px" }}>
            Role du compte
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {CHOIX_ROLE.map((c) => {
              const actif = role === c.role;
              return (
                <button
                  key={c.role}
                  type="button"
                  onClick={() => { setRole(c.role); setConfirmeAdmin(false); }}
                  aria-pressed={actif}
                  className="rounded-lg text-left"
                  style={{
                    padding: "12px", cursor: "pointer",
                    border: `${actif ? 2 : 1}px solid ${actif ? C.emerald : C.border}`,
                    backgroundColor: C.white,
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: 600, color: C.anthracite }}>{c.titre}</div>
                  <div style={{ fontSize: "11.5px", color: C.taupe, marginTop: "3px", lineHeight: 1.45 }}>{c.texte}</div>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: "11.5px", color: C.taupe, marginTop: "8px", lineHeight: 1.5 }}>
            Pour un chauffeur, passe par l&apos;ecran{" "}
            <Link href="/dashboard/chauffeurs" style={{ color: C.emerald, fontWeight: 600 }}>Chauffeurs</Link>
            {" "}: il faut aussi son permis. Les clients ouvrent leur compte eux-memes.
          </p>
        </fieldset>

        {role === "AGENT" && (
          <Champ label="Agence">
            <select value={agence} onChange={(e) => setAgence(e.target.value)} style={styleSaisie}>
              <option value="">Choisir une agence</option>
              {(points ?? []).map((p) => <option key={p.id} value={p.id}>{p.nom} ({p.ville})</option>)}
            </select>
          </Champ>
        )}

        {role && <ChampsCompte valeur={identite} changer={setIdentite} />}

        {role === "ADMIN" && (
          <label className="flex items-start gap-3 rounded-lg" style={{ backgroundColor: C.bronzeSoft, padding: "12px", cursor: "pointer" }}>
            <input type="checkbox" checked={confirmeAdmin} onChange={(e) => setConfirmeAdmin(e.target.checked)}
              style={{ width: "18px", height: "18px", marginTop: "1px", flexShrink: 0 }} />
            <span style={{ fontSize: "12.5px", color: C.anthracite, lineHeight: 1.5 }}>
              Je confirme que ce compte doit avoir tous les droits d&apos;administration, y compris creer
              d&apos;autres comptes administrateurs.
            </span>
          </label>
        )}

        <Erreur erreur={mutation.error} />

        <div className="flex gap-2">
          <Bouton onClick={envoyer} disabled={!valide || mutation.isPending}>
            {mutation.isPending ? "Creation" : "Creer le compte"}
          </Bouton>
          <Bouton variante="secondaire" onClick={fermer}>Annuler</Bouton>
        </div>
      </div>
    </Carte>
  );
}

function CompteCree({ compte, fermer }: { compte: Utilisateur; fermer: () => void }) {
  return (
    <div role="status" className="rounded-xl mb-4" style={{ backgroundColor: C.emeraldSoft, padding: "14px 16px" }}>
      <div className="flex items-start gap-2">
        <Check size={16} style={{ color: C.emerald, marginTop: "2px", flexShrink: 0 }} />
        <div className="flex-1 min-w-0" style={{ fontSize: "13px", color: C.anthracite, lineHeight: 1.6 }}>
          Compte {LIBELLE_ROLE[compte.role].toLowerCase()} cree pour <strong>{compte.prenom} {compte.nom}</strong>.
          Transmets-lui l&apos;email <span style={{ fontFamily: "var(--font-mono)" }}>{compte.email}</span> et le
          mot de passe que tu as choisi.
          <div style={{ color: C.taupe, fontSize: "12px" }}>Telephone enregistre : {compte.telephone}</div>
        </div>
        <button onClick={fermer} aria-label="Fermer le message" style={{ background: "none", border: "none", color: C.taupe, cursor: "pointer", minWidth: "32px", minHeight: "32px" }}>
          {"×"}
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Un compte de la liste
// ------------------------------------------------------------

function LigneCompte({ compte, moiId }: { compte: Utilisateur; moiId: number | undefined }) {
  const roleMut = useModifierRoleUtilisateur();
  const actifMut = useDefinirActifUtilisateur();
  const [cibleRole, setCibleRole] = useState<Role | null>(null);
  const [confirmerDesactivation, setConfirmerDesactivation] = useState(false);

  const moi = compte.id === moiId;
  // Seul le passage entre dispatch et administration est sur : voir l'en-tete.
  const roleModifiable = !moi && (compte.role === "DISPATCHER" || compte.role === "ADMIN");
  const autreRole: Role = compte.role === "ADMIN" ? "DISPATCHER" : "ADMIN";

  return (
    <Carte>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: "14px", fontWeight: 600, color: C.anthracite }}>{compte.prenom} {compte.nom}</span>
            <PastilleRole role={compte.role} />
            {!compte.actif && <Pastille texte="Desactive" fond={C.terraSoft} couleur={C.error} />}
            {moi && <Pastille texte="Toi" fond={C.sage} couleur={C.taupe} />}
          </div>
          <div style={{ fontSize: "12.5px", color: C.taupe, marginTop: "5px", overflowWrap: "anywhere" }}>
            {compte.email} {"·"} {compte.telephone}
          </div>
          <div style={{ fontSize: "11.5px", color: C.taupeLight, marginTop: "3px" }}>
            {compte.derniereConnexion ? `Derniere connexion le ${formatDateFr(compte.derniereConnexion)}` : "Jamais connecte"}
            {compte.client?.nomBoutique ? ` · ${compte.client.nomBoutique}` : ""}
          </div>
        </div>

        {!moi && cibleRole === null && !confirmerDesactivation && (
          <div className="flex gap-2 flex-wrap">
            {roleModifiable && (
              <Bouton variante="secondaire" onClick={() => setCibleRole(autreRole)}>
                Passer {LIBELLE_ROLE[autreRole].toLowerCase()}
              </Bouton>
            )}
            {compte.actif ? (
              <Bouton variante="danger" onClick={() => setConfirmerDesactivation(true)}>Desactiver</Bouton>
            ) : (
              <Bouton onClick={() => actifMut.mutate({ id: compte.id, actif: true })} disabled={actifMut.isPending}>
                Reactiver
              </Bouton>
            )}
          </div>
        )}
      </div>

      {cibleRole && (
        <div className="mt-4 rounded-lg" style={{ backgroundColor: cibleRole === "ADMIN" ? C.bronzeSoft : C.ivory, padding: "12px" }}>
          <div className="flex items-start gap-2">
            {cibleRole === "ADMIN" && <ShieldAlert size={16} style={{ color: "#8B6F3D", marginTop: "2px", flexShrink: 0 }} />}
            <p style={{ fontSize: "12.5px", color: C.anthracite, lineHeight: 1.55 }}>
              {cibleRole === "ADMIN"
                ? `${compte.prenom} ${compte.nom} aura tous les droits, y compris sur les comptes. `
                : `${compte.prenom} ${compte.nom} perdra les droits d'administration. `}
              Ses sessions en cours seront fermees, il devra se reconnecter.
            </p>
          </div>
          <Erreur erreur={roleMut.error} />
          <div className="flex gap-2 mt-3">
            <Bouton
              onClick={() => roleMut.mutate({ id: compte.id, role: cibleRole }, { onSuccess: () => setCibleRole(null) })}
              disabled={roleMut.isPending}
            >
              {roleMut.isPending ? "Modification" : `Confirmer : ${LIBELLE_ROLE[cibleRole].toLowerCase()}`}
            </Bouton>
            <Bouton variante="secondaire" onClick={() => { setCibleRole(null); roleMut.reset(); }}>Annuler</Bouton>
          </div>
        </div>
      )}

      {confirmerDesactivation && (
        <div className="mt-4 rounded-lg" style={{ backgroundColor: C.terraSoft, padding: "12px" }}>
          <p style={{ fontSize: "12.5px", color: C.anthracite, lineHeight: 1.55 }}>
            {compte.prenom} {compte.nom} ne pourra plus se connecter, et ses sessions en cours seront fermees.
            Le compte reste dans l&apos;historique et peut etre reactive.
          </p>
          <Erreur erreur={actifMut.error} />
          <div className="flex gap-2 mt-3">
            <Bouton
              variante="danger"
              onClick={() => actifMut.mutate({ id: compte.id, actif: false }, { onSuccess: () => setConfirmerDesactivation(false) })}
              disabled={actifMut.isPending}
            >
              {actifMut.isPending ? "Desactivation" : "Confirmer la desactivation"}
            </Bouton>
            <Bouton variante="secondaire" onClick={() => { setConfirmerDesactivation(false); actifMut.reset(); }}>Annuler</Bouton>
          </div>
        </div>
      )}

      {!confirmerDesactivation && actifMut.error && <div className="mt-2"><Erreur erreur={actifMut.error} /></div>}
    </Carte>
  );
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

function ContenuUtilisateurs() {
  const { data: moi } = useUtilisateur();
  const [role, setRole] = useState<Role | "">("");
  const [statut, setStatut] = useState<"" | "actifs" | "desactives">("");
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [page, setPage] = useState(1);
  const [formulaire, setFormulaire] = useState(false);
  const [dernier, setDernier] = useState<Utilisateur | null>(null);

  // La recherche part 300 ms apres la derniere frappe, pas a chaque touche.
  useEffect(() => {
    const t = setTimeout(() => { setRecherche(saisie.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [saisie]);

  const { data, isLoading, error, isPlaceholderData } = useUtilisateurs({
    role: role || undefined,
    actif: statut === "" ? undefined : statut === "actifs",
    recherche: recherche.length >= 2 ? recherche : undefined,
    page,
    parPage: PAR_PAGE,
  });
  const comptes = data?.elements ?? [];
  const pages = data?.pages ?? 1;

  return (
    <div style={{ padding: "20px 16px 48px", maxWidth: "860px" }} className="md:px-8">
      <EnTetePage
        titre="Utilisateurs"
        soustitre={data ? `${data.total} compte${data.total > 1 ? "s" : ""}` : "Chargement"}
        action={!formulaire ? (
          <Bouton onClick={() => { setFormulaire(true); setDernier(null); }}><Plus size={15} /> Compte</Bouton>
        ) : undefined}
      />

      {dernier && <CompteCree compte={dernier} fermer={() => setDernier(null)} />}
      {formulaire && <FormulaireCompte fermer={() => setFormulaire(false)} cree={setDernier} />}

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Nom, email ou telephone"
          aria-label="Rechercher un compte"
          style={{ ...styleSaisie, flex: "1 1 220px", width: "auto" }}
        />
        <select value={role} onChange={(e) => { setRole(e.target.value as Role | ""); setPage(1); }}
          aria-label="Filtrer par role" style={{ ...styleSaisie, width: "auto", flex: "0 1 170px" }}>
          <option value="">Tous les roles</option>
          {(Object.keys(LIBELLE_ROLE) as Role[]).map((r) => <option key={r} value={r}>{LIBELLE_ROLE[r]}</option>)}
        </select>
        <select value={statut} onChange={(e) => { setStatut(e.target.value as typeof statut); setPage(1); }}
          aria-label="Filtrer par statut" style={{ ...styleSaisie, width: "auto", flex: "0 1 150px" }}>
          <option value="">Tous</option>
          <option value="actifs">Actifs</option>
          <option value="desactives">Desactives</option>
        </select>
      </div>

      <Erreur erreur={error} repli="La liste des comptes n'a pas pu etre chargee." />
      {isLoading && <Chargement texte="Chargement des comptes" />}

      {!isLoading && !error && comptes.length === 0 && (
        <Vide titre="Aucun compte" texte="Aucun compte ne correspond a ces filtres." />
      )}

      {comptes.length > 0 && (
        <div className="space-y-2" style={{ opacity: isPlaceholderData ? 0.6 : 1 }}>
          {comptes.map((c) => <LigneCompte key={c.id} compte={c} moiId={moi?.id} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <Bouton variante="secondaire" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            <ChevronLeft size={15} /> Precedente
          </Bouton>
          <span style={{ fontSize: "12.5px", color: C.taupe }}>Page {page} sur {pages}</span>
          <Bouton variante="secondaire" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>
            Suivante <ChevronRight size={15} />
          </Bouton>
        </div>
      )}
    </div>
  );
}

export default function PageUtilisateurs() {
  return (
    <ReserveAu roles={["ADMIN"]}>
      <ContenuUtilisateurs />
    </ReserveAu>
  );
}
