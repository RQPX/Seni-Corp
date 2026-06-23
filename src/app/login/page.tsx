"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import { login } from "@/lib/api";

const C = {
  emerald: "#0B4D3F", emeraldDark: "#083528",
  bronze: "#B8935A", bronzeLight: "#D4B486",
  ivory: "#FAF6F0", sage: "#E8EDE5", anthracite: "#1A1A1A",
  taupe: "#6B6259", taupeLight: "#9B8A7E",
  terra: "#C66D4F", terraSoft: "#FCEEE9",
  success: "#4A6B5C", successSoft: "#E8F0ED",
  border: "#EAE3D5", white: "#FFFFFF",
};

// Identifiants de demonstration (utilises tant que l'API backend n'est pas deployee)
const DEMO_EMAIL    = process.env.NEXT_PUBLIC_DEMO_EMAIL    ?? "demo@senicorp.ci";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "SeniDemo2026";

function getPasswordStrength(pwd: string): 0 | 1 | 2 {
  if (pwd.length < 6) return 0;
  const hasUpper   = /[A-Z]/.test(pwd);
  const hasNumber  = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (pwd.length >= 8 && score >= 2) return 2;
  if (pwd.length >= 6 && score >= 1) return 1;
  return 0;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Message informatif pour les actions secondaires (mdp oublié, créer compte)
  const [infoMsg, setInfoMsg] = useState("");

  const strength = getPasswordStrength(password);
  const strengthLabel = ["Faible", "Moyen", "Fort"][strength];
  const strengthColor = [C.terra, C.bronze, C.success][strength] as string;

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }

    setLoading(true);

    // Verifier les identifiants demo en premier (avant l'appel API)
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setTimeout(() => router.push("/dashboard"), 500);
      return;
    }

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setLoading(false);
      setError("Email ou mot de passe incorrect.");
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: C.ivory }}>
      <div className="w-full" style={{ maxWidth: "400px" }}>
        <div className="text-center mb-8">
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "32px", fontWeight: 800, letterSpacing: "4px", color: C.emerald }}>SENI CORP</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "11px", letterSpacing: "3px", color: C.bronze, textTransform: "uppercase", marginTop: "4px" }}>Plateforme logistique</div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl" style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "28px" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 700, color: C.anthracite, marginBottom: "4px" }}>Connexion</h1>
          <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "24px" }}>Accedez a votre espace commercant.</p>

          {/* Message informatif (mdp oublié / créer compte) */}
          {infoMsg && (
            <div className="flex items-start gap-2 rounded-lg mb-4" style={{ padding: "10px 12px", backgroundColor: C.sage, border: `1px solid ${C.border}` }}>
              <Info size={15} style={{ color: C.taupe, flexShrink: 0, marginTop: "1px" }} />
              <span style={{ fontSize: "12px", color: C.taupe, lineHeight: 1.5 }}>{infoMsg}</span>
            </div>
          )}

          <div className="mb-4">
            <label style={{ display: "block", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe, marginBottom: "6px" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); setInfoMsg(""); }}
              placeholder="votre@email.com"
              required
              className="w-full rounded-lg"
              style={{ padding: "11px 14px", fontSize: "14px", backgroundColor: C.ivory, border: `1px solid ${C.border}`, color: C.anthracite, outline: "none" }}
            />
          </div>

          <div className="mb-4">
            <label style={{ display: "block", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe, marginBottom: "6px" }}>Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); setInfoMsg(""); }}
                placeholder="Votre mot de passe"
                required
                className="w-full rounded-lg"
                style={{ padding: "11px 42px 11px 14px", fontSize: "14px", backgroundColor: C.ivory, border: `1px solid ${error ? C.terra : C.border}`, color: C.anthracite, outline: "none" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? "Masquer" : "Afficher"} style={{ background: "none", border: "none", color: C.taupeLight, cursor: "pointer" }}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1 flex-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: i <= strength ? strengthColor : C.sage }} />
                  ))}
                </div>
                <span style={{ fontSize: "10px", fontWeight: 600, color: strengthColor }}>{strengthLabel}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg mb-4" style={{ padding: "10px 12px", backgroundColor: C.terraSoft, border: `1px solid ${C.terra}` }}>
              <AlertCircle size={15} style={{ color: C.terra, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: C.terra, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-lg"
            style={{ padding: "12px", backgroundColor: C.emerald, color: C.white, border: "none", fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Connexion en cours..." : <><LogIn size={16} /> Se connecter</>}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setInfoMsg("Pour reinitialiser votre mot de passe, contactez le support SENI CORP au +225 27 22 00 00 ou par email a support@senicorp.ci.")}
              style={{ background: "none", border: "none", fontSize: "12px", color: C.emerald, cursor: "pointer", fontWeight: 500 }}>
              Mot de passe oublie ?
            </button>
          </div>
        </form>

        <p className="text-center mt-5" style={{ fontSize: "13px", color: C.taupe }}>
          Pas encore de compte ?{" "}
          <button
            type="button"
            onClick={() => setInfoMsg("Pour creer un compte commerçant, contactez notre equipe commerciale au +225 27 22 00 00 ou rendez-vous en agence SENI CORP.")}
            style={{ background: "none", border: "none", color: C.bronze, cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
            Creer un compte
          </button>
        </p>
      </div>
    </div>
  );
}
