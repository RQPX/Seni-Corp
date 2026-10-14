// ============================================================
// SENI CORP — Page de connexion
//
// SECURITE :
// - Le verrouillage de compte est fait par le serveur (5 echecs puis
//   15, 30, 60, 240 min). L'ancien rate-limit localStorage a ete retire :
//   vider le stockage suffisait a le contourner, il ne protegeait rien
//   et donnait une fausse impression de securite.
// - Aucun jeton n'est stocke : le backend pose des cookies httpOnly.
// ============================================================

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import { login, ApiError } from "@/lib/api";
import { C } from "@/lib/tokens";

// ============================================================
// PAGE LOGIN
// ============================================================
function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // -- Affiche un message si on vient d'une session expiree --
  useEffect(() => {
    if (searchParams.get("session") === "expired") {
      setInfoMsg("Votre session a expire. Reconnectez-vous pour continuer.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");

    if (!email.trim() || !password) {
      setError("Renseigne ton email et ton mot de passe.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Adresse email invalide.");
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);
      // Le backend a pose les cookies de session : le middleware laisse passer
      router.push("/dashboard");
    } catch (err) {
      setLoading(false);

      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Email ou mot de passe incorrect.");
        } else if (err.status === 403 || err.status === 429) {
          // Le serveur precise le delai restant du verrouillage : on l'affiche tel quel
          setError(err.message);
        } else if (err.status === 0) {
          setError("Impossible de contacter le serveur. Verifie ta connexion.");
        } else {
          setError(err.message || "Erreur de connexion.");
        }
      } else {
        setError("Une erreur inattendue est survenue.");
      }
    }
  };


  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        backgroundColor: C.ivory,
        // dvh pour bien s'adapter sur iOS
        minHeight: "100dvh",
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      <div className="w-full" style={{ maxWidth: "400px" }}>
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

        {/* Formulaire */}
        {/* autoComplete="on" pour laisser le gestionnaire de mots de passe intervenir */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl"
          style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "28px" }}
          autoComplete="on"
          // noValidate : on gere la validation nous-memes pour de meilleurs messages
          noValidate
        >
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 700, color: C.anthracite, marginBottom: "4px" }}>
            Connexion
          </h1>
          <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "24px" }}>
            Accedez a votre espace client.
          </p>

          {/* Message informatif (session expiree, mdp oublie, etc.) */}
          {infoMsg && (
            <div
              className="flex items-start gap-2 rounded-lg mb-4"
              style={{ padding: "10px 12px", backgroundColor: C.sage, border: `1px solid ${C.border}` }}
              role="status"
            >
              <Info size={15} style={{ color: C.taupe, flexShrink: 0, marginTop: "1px" }} />
              <span style={{ fontSize: "12px", color: C.taupe, lineHeight: 1.5 }}>{infoMsg}</span>
            </div>
          )}

          {/* Champ email */}
          <div className="mb-4">
            <label
              htmlFor="login-email"
              style={{ display: "block", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe, marginBottom: "6px" }}
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="username"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); setInfoMsg(""); }}
              placeholder="votre@email.com"
              required
              className="w-full rounded-lg"
              style={{
                padding: "12px 14px",
                fontSize: "16px", // 16px pour eviter le zoom iOS
                backgroundColor: C.ivory,
                border: `1px solid ${C.border}`,
                color: C.anthracite, outline: "none",
                minHeight: "44px",
              }}
            />
          </div>

          {/* Champ mot de passe */}
          <div className="mb-4">
            <label
              htmlFor="login-password"
              style={{ display: "block", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe, marginBottom: "6px" }}
            >
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); setInfoMsg(""); }}
                placeholder="Votre mot de passe"
                required
                className="w-full rounded-lg"
                style={{
                  padding: "12px 44px 12px 14px",
                  fontSize: "16px",
                  backgroundColor: C.ivory,
                  border: `1px solid ${error ? C.terra : C.border}`,
                  color: C.anthracite, outline: "none",
                  minHeight: "44px",
                }}
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
          </div>

          {/* Message d'erreur */}
          {error && (
            <div
              className="flex items-start gap-2 rounded-lg mb-4"
              style={{ padding: "10px 12px", backgroundColor: C.terraSoft, border: `1px solid ${C.terra}` }}
              role="alert"
            >
              <AlertCircle size={15} style={{ color: C.terra, flexShrink: 0, marginTop: "1px" }} />
              <span style={{ fontSize: "12px", color: C.terra, fontWeight: 500, lineHeight: 1.5 }}>{error}</span>
            </div>
          )}

          {/* Bouton de connexion */}
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
            {loading ? "Connexion en cours..." : (<><LogIn size={16} />Se connecter</>)}
          </button>

          {/* Lien mot de passe oublie */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setInfoMsg(
                "Pour reinitialiser ton mot de passe, contacte le support " +
                "au +225 27 22 00 00 ou par email a support@seni-corp.ci."
              )}
              style={{
                background: "none", border: "none", fontSize: "12px",
                color: C.emerald, cursor: "pointer", fontWeight: 500,
                padding: "8px",
                minHeight: "32px",
              }}
            >
              Mot de passe oublie ?
            </button>
          </div>
        </form>

        {/* Lien vers la creation de compte */}
        <p className="text-center mt-5" style={{ fontSize: "13px", color: C.taupe }}>
          Pas encore de compte ?{" "}
          <Link href="/inscription" style={{ color: C.bronze, fontWeight: 600, textDecoration: "none" }}>
            Creer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}


// -- Export : enveloppe dans Suspense pour useSearchParams --
export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: C.taupe }}>Chargement...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
