// ============================================================
// Champs d'identite d'un nouveau compte
//
// Communs aux ecrans Chauffeurs et Utilisateurs. Le mot de passe est
// choisi par la personne qui cree le compte, puis transmis au titulaire.
//
// La verification ici ne sert qu'a guider la saisie. Le serveur applique
// la meme politique, plus une liste de mots de passe courants : c'est
// son message qui s'affiche en cas de refus.
// ============================================================

"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Champ, styleSaisie } from "@/components/ui";
import { C } from "@/lib/tokens";

export interface Identite {
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  motDePasse: string;
}

export const IDENTITE_VIDE: Identite = { prenom: "", nom: "", telephone: "", email: "", motDePasse: "" };

/** Meme politique que le backend : 12 caracteres et 3 familles, ou 16 et plus. */
export function problemeMotDePasse(mdp: string): string | null {
  if (mdp.length >= 16) return null;
  if (mdp.length < 12) return "Au moins 12 caracteres, ou 16 sans autre condition.";
  const familles = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(mdp)).length;
  if (familles < 3) return "Melange au moins 3 types : minuscules, majuscules, chiffres, symboles.";
  return null;
}

export function identiteValide(i: Identite): boolean {
  return (
    i.prenom.trim().length >= 2 && i.nom.trim().length >= 2 &&
    i.telephone.replace(/\D/g, "").length >= 8 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.email.trim()) &&
    problemeMotDePasse(i.motDePasse) === null
  );
}

/** Valeurs nettoyees, pretes a envoyer. */
export function identitePourEnvoi(i: Identite): Identite {
  return {
    prenom: i.prenom.trim(), nom: i.nom.trim(), telephone: i.telephone.trim(),
    email: i.email.trim().toLowerCase(), motDePasse: i.motDePasse,
  };
}

export function ChampsCompte({ valeur, changer }: { valeur: Identite; changer: (v: Identite) => void }) {
  const [visible, setVisible] = useState(false);
  const maj = (cle: keyof Identite) => (e: React.ChangeEvent<HTMLInputElement>) =>
    changer({ ...valeur, [cle]: e.target.value });
  const probleme = valeur.motDePasse ? problemeMotDePasse(valeur.motDePasse) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Champ label="Prenom">
          <input value={valeur.prenom} onChange={maj("prenom")} maxLength={80} autoComplete="off" style={styleSaisie} />
        </Champ>
        <Champ label="Nom">
          <input value={valeur.nom} onChange={maj("nom")} maxLength={80} autoComplete="off" style={styleSaisie} />
        </Champ>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Champ label="Telephone">
          <input value={valeur.telephone} onChange={maj("telephone")} inputMode="tel" maxLength={20}
            placeholder="07 00 00 00 00" autoComplete="off" style={styleSaisie} />
        </Champ>
        <Champ label="Email" aide="Sert d'identifiant de connexion.">
          <input value={valeur.email} onChange={maj("email")} type="email" maxLength={254}
            autoComplete="off" style={styleSaisie} />
        </Champ>
      </div>

      <Champ
        label="Mot de passe"
        aide="Tu le choisis et tu le transmets a la personne. 12 caracteres et 3 types differents, ou 16 caracteres."
      >
        <div className="flex gap-2">
          <input
            value={valeur.motDePasse}
            onChange={maj("motDePasse")}
            type={visible ? "text" : "password"}
            maxLength={128}
            autoComplete="new-password"
            style={{ ...styleSaisie, fontFamily: "var(--font-mono)" }}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="rounded-lg shrink-0"
            style={{ border: `1px solid ${C.border}`, background: C.white, color: C.taupe, width: "44px", cursor: "pointer" }}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Champ>
      {probleme && <p style={{ fontSize: "12px", color: C.warning, marginTop: "-8px" }}>{probleme}</p>}
    </div>
  );
}
