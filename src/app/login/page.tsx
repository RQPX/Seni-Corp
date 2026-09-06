// ============================================================
// SENI CORP — Page de connexion
// Point d'entree de l'espace commercant.
//
// SECURITE :
// - Rate-limiting cote client : 5 tentatives max sur 15 minutes
//   (protection minimale en attendant le rate-limit backend)
// - Les identifiants "demo" ne sont utilises QU'en developpement
// - Le mot de passe est envoye en HTTPS uniquement (config Next.js)
// - Le backend renvoie un cookie httpOnly, jamais un jeton dans le corps
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LogIn, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import { login, ApiError } from "@/lib/api";

const C = {
  emerald: "#0B4D3F", emeraldDark: "#083528",
  bronze: "#B8935A", bronzeLight: "#D4B486",
  ivory: "#FAF6F0", sage: "#E8EDE5", anthracite: "#1A1A1A",
  taupe: "#6B6259", taupeLight: "#9B8A7E",
  terra: "#C66D4F", terraSoft: "#FCEEE9",
  success: "#4A6B5C", successSoft: "#E8F0ED",
  border: "#EAE3D5", white: "#FFFFFF",
};

// -- Mode demo --
// Aucune valeur par defaut : si les variables ne sont pas definies,
// le mode demo n'existe pas. Ne jamais committer d'identifiants.
const DEMO_EMAIL    = process.env.NEXT_PUBLIC_DEMO_EMAIL;
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD;
const isDevMode     = process.env.NODE_ENV === "development";
const demoEnabled   = isDevMode && !!DEMO_EMAIL && !!DEMO_PASSWORD;

// -- Rate limiting : constantes --
const MAX_ATTEMPTS = 5;              // nombre max de tentatives
const LOCKOUT_MINUTES = 15;          // duree du blocage en minutes
const STORAGE_KEY = "seni_login_attempts";

// -- Structure sauvegardee dans le localStorage --
type AttemptRecord = {
  count: number;      // nombre de tentatives depuis le debut de la fenetre
  firstAt: number;    // date/heure de la premiere tentative (timestamp ms)
};


// -- Lit les tentatives sauvegardees --
function getAttempts(): AttemptRecord {
  if (typeof window === "undefined") return { count: 0, firstAt: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { count: 0, firstAt: 0 };
  } catch {
    return { count: 0, firstAt: 0 };
  }
}

// -- Sauvegarde les tentatives --
function saveAttempts(record: AttemptRecord) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Silencieux si le storage est plein / bloque
  }
}

// -- Verifie si le user est bloque, retourne les minutes restantes ou 0 --
function checkLockout(): number {
  const rec = getAttempts();
  if (rec.count < MAX_ATTEMPTS) return 0;

  const elapsedMinutes = (Date.now() - rec.firstAt) / (1000 * 60);
  if (elapsedMinutes >= LOCKOUT_MINUTES) {
    // Fenetre expiree, on remet a zero
    saveAttempts({ count: 0, firstAt: 0 });
    return 0;
  }

  return Math.ceil(LOCKOUT_MINUTES - elapsedMinutes);
}

// -- Incremente le compteur de tentatives --
function incrementAttempts() {
  const rec = getAttempts();
  const now = Date.now();
  const elapsedMinutes = (now - rec.firstAt) / (1000 * 60);

  // Si la fenetre est expiree, on repart a zero
  if (rec.firstAt === 0 || elapsedMinutes >= LOCKOUT_MINUTES) {
    saveAttempts({ count: 1, firstAt: now });
  } else {
    saveAttempts({ count: rec.count + 1, firstAt: rec.firstAt });
  }
}

// -- Efface les tentatives (apres connexion reussie) --
function clearAttempts() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}


// -- Force du mot de passe (visuel uniquement) --
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
  const [lockoutMinutes, setLockoutMinutes] = useState(0);

  // -- Verifie le blocage au chargement de la page --
  useEffect(() => {
    setLockoutMinutes(checkLockout());
  }, []);

  // -- Affiche un message si on vient d'une session expiree --
  useEffect(() => {
    if (searchParams.get("session") === "expired") {
      setInfoMsg("Votre session a expire. Reconnectez-vous pour continuer.");
    }
  }, [searchParams]);

  const strength = getPasswordStrength(password);
  const strengthLabel = ["Faible", "Moyen", "Fort"][strength];
  const strengthColor = [C.terra, C.bronze, C.success][strength] as string;

  // -- Soumission du formulaire --
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");

    // -- Verification du blocage --
    const remaining = checkLockout();
    if (remaining > 0) {
      setLockoutMinutes(remaining);
      setError(`Trop de tentatives. Reessaie dans ${remaining} minute${remaining > 1 ? "s" : ""}.`);
      return;
    }

    // -- Validation basique cote client --
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }

    // -- Validation basique de l'email --
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Adresse email invalide.");
      return;
    }

    setLoading(true);

    // -- Mode demo (dev uniquement, et seulement si configure) --
    if (demoEnabled && email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      clearAttempts();
      setLoading(false);            // <- manquait : loading restait bloque
      router.push("/dashboard");
      return;
    }

    // -- Appel API reel (le backend pose le cookie httpOnly) --
    try {
      await login(email, password);
      clearAttempts();
      router.push("/dashboard");
    } catch (err) {
      setLoading(false);
      incrementAttempts();

      // Message d'erreur specifique selon le type
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          setError("Email ou mot de passe incorrect.");
        } else if (err.status === 429) {
          setError("Trop de tentatives. Le serveur t'a temporairement bloque.");
        } else if (err.status === 0) {
          setError("Impossible de contacter le serveur. Verifie ta connexion.");
        } else {
          setError(err.message || "Erreur de connexion.");
        }
      } else {
        setError("Une erreur inattendue est survenue.");
      }

      // Verifier a nouveau si on est desormais bloque
      const nowRemaining = checkLockout();
      if (nowRemaining > 0) setLockoutMinutes(nowRemaining);
    }
  };


  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        backgroundColor: C.ivory,
        // dvh pour bien s'adapter sur iOS
        minHeight: "100dvh",
        maxWidth: "100vw",
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
            Accedez a votre espace commercant.
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
              disabled={lockoutMinutes > 0}
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
                disabled={lockoutMinutes > 0}
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

            {/* Indicateur de force */}
            {password.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1 flex-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{ backgroundColor: i <= strength ? strengthColor : C.sage }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: "10px", fontWeight: 600, color: strengthColor }}>
                  {strengthLabel}
                </span>
              </div>
            )}
          </div>

          {/* Message d'erreur */}
          {error && (
            <div
              className="flex items-center gap-2 rounded-lg mb-4"
              style={{ padding: "10px 12px", backgroundColor: C.terraSoft, border: `1px solid ${C.terra}` }}
              role="alert"
            >
              <AlertCircle size={15} style={{ color: C.terra, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: C.terra, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Bouton de connexion */}
          <button
            type="submit"
            disabled={loading || lockoutMinutes > 0}
            className="w-full flex items-center justify-center gap-2 rounded-lg"
            style={{
              padding: "13px",
              backgroundColor: (loading || lockoutMinutes > 0) ? C.taupeLight : C.emerald,
              color: C.white, border: "none",
              fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600,
              cursor: (loading || lockoutMinutes > 0) ? "wait" : "pointer",
              opacity: (loading || lockoutMinutes > 0) ? 0.7 : 1,
              minHeight: "48px",
            }}
          >
            {loading ? "Connexion en cours..." : (
              <>
                <LogIn size={16} />
                {lockoutMinutes > 0 ? `Bloque ${lockoutMinutes} min` : "Se connecter"}
              </>
            )}
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
          <button
            type="button"
            onClick={() => setInfoMsg(
              "Pour creer un compte commercant, contacte notre equipe commerciale " +
              "au +225 27 22 00 00 ou rends-toi en agence SENI CORP."
            )}
            style={{
              background: "none", border: "none",
              color: C.bronze, cursor: "pointer", fontWeight: 600, fontSize: "13px",
              padding: "4px 8px",
              minHeight: "32px",
            }}
          >
            Creer un compte
          </button>
        </p>

        {/* Bandeau demo (uniquement en dev) */}
        {demoEnabled && (
          <div
            className="mt-6 rounded-lg text-center"
            style={{ padding: "10px", backgroundColor: C.successSoft, border: `1px dashed ${C.success}` }}
          >
            <p style={{ fontSize: "11px", color: C.success, fontWeight: 600 }}>
              Mode developpement — compte de demonstration actif
            </p>
          </div>
        )}
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
