// ============================================================
// SENI CORP metier — Connexion
//
// Meme authentification que l'espace client : cookies httpOnly poses par
// le backend, aucun jeton stocke ici. Le verrouillage de compte est fait
// par le serveur, qui indique le delai restant dans son message.
// ============================================================

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import { login, ApiError } from "@/lib/api";
import { C } from "@/lib/tokens";

function PageConnexion() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [visible, setVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (params.get("session") === "expired") {
      setInfo("Ta session a expire. Reconnecte-toi pour continuer.");
    }
  }, [params]);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur("");
    setInfo("");

    if (!email.trim() || !motDePasse) {
      setErreur("Renseigne ton email et ton mot de passe.");
      return;
    }

    setEnCours(true);
    try {
      await login(email.trim(), motDePasse);
      router.push("/dashboard");
    } catch (err) {
      setEnCours(false);
      if (err instanceof ApiError) {
        // Un 401 recouvre deux cas : identifiants errones et compte
        // verrouille. Le serveur precise lequel, on relaie son message.
        setErreur(err.status === 0
          ? "Impossible de contacter le serveur. Verifie ta connexion."
          : err.message);
      } else {
        setErreur("Une erreur inattendue est survenue.");
      }
    }
  };

  const champ: React.CSSProperties = {
    padding: "12px 14px",
    fontSize: "16px", // 16px : evite le zoom automatique sur iOS
    backgroundColor: C.ivory,
    border: `1px solid ${C.border}`,
    color: C.anthracite,
    outline: "none",
    minHeight: "44px",
    width: "100%",
    borderRadius: "8px",
  };

  return (
    <div
      className="flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: C.ivory, minHeight: "100dvh", overflowX: "hidden" }}
    >
      <div className="w-full" style={{ maxWidth: "400px" }}>
        <div className="text-center mb-8">
          <div style={{
            fontFamily: "var(--font-heading)", fontSize: "32px", fontWeight: 800,
            letterSpacing: "4px", color: C.emerald,
          }}>
            SENI CORP
          </div>
          <div style={{
            fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "3px",
            color: C.bronze, textTransform: "uppercase", marginTop: "4px",
          }}>
            Exploitation
          </div>
        </div>

        <form
          onSubmit={soumettre}
          className="rounded-2xl"
          style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "28px" }}
          autoComplete="on"
          noValidate
        >
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 700, color: C.anthracite, marginBottom: "4px" }}>
            Connexion
          </h1>
          <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "24px" }}>
            Reserve au personnel SENI CORP.
          </p>

          {info && (
            <div
              className="flex items-start gap-2 rounded-lg mb-4"
              style={{ padding: "10px 12px", backgroundColor: C.sage, border: `1px solid ${C.border}` }}
              role="status"
            >
              <Info size={15} style={{ color: C.taupe, flexShrink: 0, marginTop: "1px" }} />
              <span style={{ fontSize: "12px", color: C.taupe, lineHeight: 1.5 }}>{info}</span>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" style={{ display: "block", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe, marginBottom: "6px" }}>
              Email
            </label>
            <input
              id="email" type="email" inputMode="email" autoComplete="username"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErreur(""); }}
              placeholder="agent1.adjame@senicorp.ci"
              required style={champ}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="mdp" style={{ display: "block", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe, marginBottom: "6px" }}>
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="mdp" type={visible ? "text" : "password"} autoComplete="current-password"
                value={motDePasse}
                onChange={(e) => { setMotDePasse(e.target.value); setErreur(""); }}
                required
                style={{ ...champ, padding: "12px 44px 12px 14px", border: `1px solid ${erreur ? C.terra : C.border}` }}
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ background: "none", border: "none", color: C.taupeLight, cursor: "pointer", minWidth: "32px", minHeight: "32px" }}
              >
                {visible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {erreur && (
            <div
              className="flex items-start gap-2 rounded-lg mb-4"
              style={{ padding: "10px 12px", backgroundColor: C.terraSoft, border: `1px solid ${C.terra}` }}
              role="alert"
            >
              <AlertCircle size={15} style={{ color: C.terra, flexShrink: 0, marginTop: "1px" }} />
              <span style={{ fontSize: "12px", color: C.terra, fontWeight: 500, lineHeight: 1.5 }}>{erreur}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={enCours}
            className="w-full flex items-center justify-center gap-2 rounded-lg"
            style={{
              padding: "13px",
              backgroundColor: enCours ? C.taupeLight : C.emerald,
              color: C.white, border: "none",
              fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600,
              cursor: enCours ? "wait" : "pointer",
              opacity: enCours ? 0.7 : 1,
              minHeight: "48px",
            }}
          >
            {enCours ? "Connexion en cours..." : (<><LogIn size={16} />Se connecter</>)}
          </button>
        </form>

        <p className="text-center mt-5" style={{ fontSize: "12px", color: C.taupeLight, lineHeight: 1.6 }}>
          Les comptes du personnel sont crees par un administrateur.
          Contacte-le si tu n&apos;arrives pas a te connecter.
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#6B6259" }}>Chargement...</div>}>
      <PageConnexion />
    </Suspense>
  );
}
