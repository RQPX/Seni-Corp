// ============================================================
// SENI CORP — Page d'inscription
// Cree un compte client (particulier ou entreprise).
// L'inscription connecte automatiquement : le backend pose les
// cookies de session, on redirige ensuite vers le dashboard.
//
// Plafond serveur : 5 inscriptions par heure et par IP.
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Eye, EyeOff, AlertCircle } from "lucide-react";
import { ApiError, register } from "@/lib/api";
import { forceMotDePasse, validerMotDePasse } from "@/lib/motDePasse";
import type { TypeClient } from "@/lib/statuts";
import { C } from "@/lib/tokens";

const inputStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: "16px", // 16px pour eviter le zoom automatique sur iOS
  borderRadius: "8px",
  backgroundColor: C.ivory,
  border: `1px solid ${C.border}`,
  color: C.anthracite,
  outline: "none",
  width: "100%",
  minHeight: "44px",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "10px", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.5px",
  color: C.taupe, marginBottom: "6px",
};

export default function InscriptionPage() {
  const router = useRouter();

  const [typeClient, setTypeClient] = useState<TypeClient>("PARTICULIER");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [ville, setVille] = useState("");
  const [nomBoutique, setNomBoutique] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreurs, setErreurs] = useState<string[]>([]);

  const estEntreprise = typeClient === "ENTREPRISE";
  const force = forceMotDePasse(motDePasse);
  const forceLabel = ["Faible", "Moyen", "Fort"][force];
  const forceColor = [C.terra, C.bronze, C.success][force];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurs([]);

    // -- Validation cote client : retour immediat, le serveur retranche --
    const problemes: string[] = [];

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      problemes.push("Adresse email invalide.");
    }
    if (!prenom.trim() || !nom.trim()) {
      problemes.push("Le nom et le prenom sont obligatoires.");
    }
    if (!telephone.trim()) {
      problemes.push("Le numero de telephone est obligatoire.");
    }
    // nomBoutique est obligatoire pour une entreprise, interdit pour un particulier
    if (estEntreprise && !nomBoutique.trim()) {
      problemes.push("Le nom de la boutique est obligatoire pour un compte entreprise.");
    }
    problemes.push(...validerMotDePasse(motDePasse, { nom, prenom, email }));
    if (motDePasse !== confirmation) {
      problemes.push("Les deux mots de passe ne correspondent pas.");
    }

    if (problemes.length > 0) { setErreurs(problemes); return; }

    setLoading(true);
    try {
      await register({
        email: email.trim(),
        motDePasse,
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim(),
        typeClient,
        // Le champ est interdit cote serveur pour un particulier : on ne l'envoie pas
        ...(estEntreprise ? { nomBoutique: nomBoutique.trim() } : {}),
        ...(ville.trim() ? { ville: ville.trim() } : {}),
      });
      // L'inscription connecte automatiquement
      router.push("/dashboard");
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setErreurs(["Trop d'inscriptions depuis ce reseau. Reessaie dans une heure."]);
        } else {
          setErreurs(err.messages);
        }
      } else {
        setErreurs(["Une erreur inattendue est survenue."]);
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        backgroundColor: C.ivory,
        minHeight: "100dvh",
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      <div className="w-full" style={{ maxWidth: "460px" }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div style={{
            fontFamily: "var(--font-heading)",
            fontSize: "32px", fontWeight: 800, letterSpacing: "4px",
            color: C.emerald,
          }}>
            SENI CORP
          </div>
          <div style={{
            fontFamily: "var(--font-heading)",
            fontSize: "11px", letterSpacing: "3px",
            color: C.bronze, textTransform: "uppercase", marginTop: "4px",
          }}>
            Plateforme logistique
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl"
          style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "28px" }}
          autoComplete="on"
          noValidate
        >
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 700, color: C.anthracite, marginBottom: "4px" }}>
            Creer un compte
          </h1>
          <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "22px" }}>
            Quelques informations et tu peux envoyer ton premier colis.
          </p>

          {/* Type de compte */}
          <div className="mb-5">
            <span style={labelStyle}>Type de compte</span>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: "PARTICULIER" as const, titre: "Particulier", desc: "Envois personnels" },
                { id: "ENTREPRISE" as const,  titre: "Entreprise",  desc: "Boutique ou commerce" },
              ]).map((opt) => {
                const actif = typeClient === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTypeClient(opt.id)}
                    className="text-left rounded-lg"
                    style={{
                      padding: "12px 14px",
                      border: `2px solid ${actif ? C.emerald : C.border}`,
                      backgroundColor: actif ? C.emeraldSoft : C.ivory,
                      cursor: "pointer", minHeight: "44px",
                    }}
                    aria-pressed={actif}
                  >
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: C.anthracite }}>
                      {opt.titre}
                    </div>
                    <div style={{ fontSize: "11px", color: C.taupe, marginTop: "2px" }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="prenom" style={labelStyle}>Prenom</label>
              <input id="prenom" type="text" autoComplete="given-name" value={prenom}
                onChange={(e) => setPrenom(e.target.value)} placeholder="Awa" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="nom" style={labelStyle}>Nom</label>
              <input id="nom" type="text" autoComplete="family-name" value={nom}
                onChange={(e) => setNom(e.target.value)} placeholder="Traore" style={inputStyle} />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="email" style={labelStyle}>Email</label>
            <input id="email" type="email" inputMode="email" autoComplete="username" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="awa@exemple.ci" style={inputStyle} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="telephone" style={labelStyle}>Telephone</label>
              <input id="telephone" type="tel" inputMode="tel" autoComplete="tel" value={telephone}
                onChange={(e) => setTelephone(e.target.value)} placeholder="+225 07 89 12 34 56" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="ville" style={labelStyle}>Ville (optionnel)</label>
              <input id="ville" type="text" autoComplete="address-level2" value={ville}
                onChange={(e) => setVille(e.target.value)} placeholder="Abidjan" style={inputStyle} />
            </div>
          </div>

          {/* Uniquement pour les entreprises : le serveur refuse ce champ pour un particulier */}
          {estEntreprise && (
            <div className="mb-4">
              <label htmlFor="boutique" style={labelStyle}>Nom de la boutique</label>
              <input id="boutique" type="text" autoComplete="organization" value={nomBoutique}
                onChange={(e) => setNomBoutique(e.target.value)} placeholder="Awa Cosmetics" style={inputStyle} />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="mdp" style={labelStyle}>Mot de passe</label>
            <div className="relative">
              <input
                id="mdp"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="12 caracteres minimum"
                style={{ ...inputStyle, padding: "12px 44px 12px 14px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                style={{ background: "none", border: "none", color: C.taupeLight, cursor: "pointer", minWidth: "32px", minHeight: "32px" }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {motDePasse.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1 flex-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                      style={{ backgroundColor: i <= force ? forceColor : C.sage }} />
                  ))}
                </div>
                <span style={{ fontSize: "10px", fontWeight: 600, color: forceColor }}>{forceLabel}</span>
              </div>
            )}
            <p style={{ fontSize: "11px", color: C.taupeLight, marginTop: "6px", lineHeight: 1.5 }}>
              12 caracteres minimum avec au moins 3 types de caracteres, ou 16 caracteres et plus.
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="mdp-confirm" style={labelStyle}>Confirmer le mot de passe</label>
            <input
              id="mdp-confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Repete le mot de passe"
              style={inputStyle}
            />
          </div>

          {erreurs.length > 0 && (
            <div
              className="flex items-start gap-2 rounded-lg mb-4"
              style={{ padding: "10px 12px", backgroundColor: C.terraSoft, border: `1px solid ${C.terra}` }}
              role="alert"
            >
              <AlertCircle size={15} style={{ color: C.terra, flexShrink: 0, marginTop: "2px" }} />
              <div>
                {erreurs.map((m, i) => (
                  <p key={i} style={{ fontSize: "12px", color: C.terra, fontWeight: 500, lineHeight: 1.5 }}>{m}</p>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg"
            style={{
              padding: "13px",
              backgroundColor: loading ? C.taupeLight : C.emerald,
              color: C.white, border: "none",
              fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
              minHeight: "48px",
            }}
          >
            {loading ? "Creation du compte..." : (<><UserPlus size={16} />Creer mon compte</>)}
          </button>
        </form>

        <p className="text-center mt-5" style={{ fontSize: "13px", color: C.taupe }}>
          Deja un compte ?{" "}
          <Link href="/login" style={{ color: C.bronze, fontWeight: 600, textDecoration: "none" }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
