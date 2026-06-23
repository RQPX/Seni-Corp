// ============================================================
// SENI CORP — Page "Parametres"
// Parametres du compte : profil, entreprise, notifications, securite.
// ============================================================

"use client";

import { useState } from "react";
import { User, Building2, Bell, Shield, Save, Check, AlertCircle } from "lucide-react";

const C = {
  emerald: "#0B4D3F", emeraldSoft: "#E8F0ED",
  bronze: "#B8935A", bronzeLight: "#D4B486", bronzeSoft: "#F5EFE3",
  ivory: "#FAF6F0", sage: "#E8EDE5", anthracite: "#1A1A1A",
  taupe: "#6B6259", taupeLight: "#9B8A7E", border: "#EAE3D5",
  terra: "#C66D4F", terraSoft: "#FCEEE9",
  white: "#FFFFFF",
};

const inputStyle: React.CSSProperties = {
  padding: "11px 14px", fontSize: "14px", borderRadius: "10px",
  backgroundColor: C.ivory, border: `1px solid ${C.border}`,
  color: C.anthracite, fontFamily: "var(--font-body)",
  outline: "none", width: "100%",
};

const TABS = [
  { id: "profil",        label: "Profil",        icon: User },
  { id: "entreprise",    label: "Entreprise",    icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "securite",      label: "Securite",      icon: Shield },
];

// Bouton "Enregistrer" avec retour visuel de succes
function SaveButton({ onSave, label = "Enregistrer" }: { onSave: () => boolean; label?: string }) {
  const [saved, setSaved] = useState(false);

  const handleClick = () => {
    const ok = onSave();
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2 rounded-lg transition-colors"
      style={{
        padding: "10px 20px",
        backgroundColor: saved ? C.emeraldSoft : C.emerald,
        color: saved ? C.emerald : C.white,
        border: saved ? `1px solid ${C.emerald}` : "none",
        fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer",
      }}
    >
      {saved ? <Check size={15} /> : <Save size={15} />}
      {saved ? "Enregistre !" : label}
    </button>
  );
}

// Toggle de notifications
function Toggle({ label, description, defaultOn = false }: {
  label: string; description: string; defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start gap-4 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="flex-1">
        <div style={{ fontSize: "14px", fontWeight: 500, color: C.anthracite }}>{label}</div>
        <div style={{ fontSize: "12px", color: C.taupe, marginTop: "2px" }}>{description}</div>
      </div>
      <button
        onClick={() => setOn(!on)}
        role="switch"
        aria-checked={on}
        className="shrink-0 rounded-full transition-colors"
        style={{
          width: "44px", height: "24px",
          backgroundColor: on ? C.emerald : C.border,
          position: "relative", border: "none", cursor: "pointer",
        }}
      >
        <span className="block rounded-full transition-transform" style={{
          width: "18px", height: "18px",
          backgroundColor: C.white, position: "absolute",
          top: "3px", left: on ? "23px" : "3px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }} />
      </button>
    </div>
  );
}

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState("profil");

  // --- Onglet Profil ---
  const [nom, setNom] = useState("Seni N'Diaye");
  const [tel, setTel] = useState("+225 07 12 34 56 78");
  const [email, setEmail] = useState("SeniNdiaye@modeadjame.com");
  const [langue, setLangue] = useState("fr");

  // --- Onglet Entreprise ---
  const [nomCommercial, setNomCommercial] = useState("Mode Adjame");
  const [rccm, setRccm] = useState("CI-ABJ-2024-B-12345");
  const [adresse, setAdresse] = useState("Marche Adjame, Stand 245, Abidjan");

  // --- Onglet Securite ---
  const [pwdActuel, setPwdActuel] = useState("");
  const [pwdNouveau, setPwdNouveau] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdError, setPwdError] = useState("");

  const saveProfil = () => {
    // En production : appel API PATCH /commercants/profil
    return true;
  };

  const saveEntreprise = () => {
    // En production : appel API PATCH /commercants/entreprise
    return true;
  };

  const savePassword = () => {
    setPwdError("");
    if (!pwdActuel) { setPwdError("Entrez votre mot de passe actuel."); return false; }
    if (pwdNouveau.length < 8) { setPwdError("Le nouveau mot de passe doit contenir au moins 8 caracteres."); return false; }
    if (pwdNouveau !== pwdConfirm) { setPwdError("Les deux mots de passe ne correspondent pas."); return false; }
    // En production : appel API PATCH /auth/password
    setPwdActuel(""); setPwdNouveau(""); setPwdConfirm("");
    return true;
  };

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 max-w-[1000px] mx-auto">
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700, color: C.anthracite, marginBottom: "24px" }}>
        Parametres
      </h1>

      {/* Onglets */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6" style={{ borderBottom: `1px solid ${C.border}` }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 shrink-0 px-4 py-2.5 transition-colors"
              style={{
                fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-heading)",
                color: isActive ? C.emerald : C.taupe,
                background: "none", border: "none", cursor: "pointer",
                borderBottomWidth: "2px", borderBottomStyle: "solid",
                borderBottomColor: isActive ? C.emerald : "transparent",
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      <div className="rounded-2xl" style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "24px" }}>

        {/* PROFIL */}
        {activeTab === "profil" && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 pb-5" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-center rounded-full" style={{
                width: "56px", height: "56px",
                background: `linear-gradient(135deg, ${C.bronze}, ${C.bronzeLight})`,
                fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.white,
              }}>
                SN
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: C.anthracite }}>{nom}</div>
                <div style={{ fontSize: "12px", color: C.taupe }}>{email}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe }}>Nom complet</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe }}>Telephone</label>
                <input type="tel" value={tel} onChange={(e) => setTel(e.target.value)} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe }}>Langue</label>
                <select value={langue} onChange={(e) => setLangue(e.target.value)} style={inputStyle}>
                  <option value="fr">Francais</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <SaveButton onSave={saveProfil} />
          </div>
        )}

        {/* ENTREPRISE */}
        {activeTab === "entreprise" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe }}>Nom commercial</label>
                <input type="text" value={nomCommercial} onChange={(e) => setNomCommercial(e.target.value)} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe }}>Numero RCCM</label>
                <input type="text" value={rccm} onChange={(e) => setRccm(e.target.value)} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe }}>Adresse</label>
                <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <SaveButton onSave={saveEntreprise} />
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div>
            <Toggle label="SMS de confirmation" description="Recevoir un SMS a chaque creation de colis." defaultOn />
            <Toggle label="SMS de livraison" description="Recevoir un SMS quand un colis est livre." defaultOn />
            <Toggle label="Alertes solde bas" description="Notification quand le solde descend sous 10 000 XOF." defaultOn />
            <Toggle label="Rapport hebdomadaire" description="Recevoir un resume par email chaque lundi." defaultOn={false} />
            <Toggle label="Notifications push" description="Notifications dans le navigateur (desktop)." defaultOn={false} />
          </div>
        )}

        {/* SECURITE */}
        {activeTab === "securite" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe }}>Mot de passe actuel</label>
              <input type="password" placeholder="Entrez votre mot de passe actuel" value={pwdActuel} onChange={(e) => { setPwdActuel(e.target.value); setPwdError(""); }} style={inputStyle} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe }}>Nouveau mot de passe</label>
                <input type="password" placeholder="8 caracteres minimum" value={pwdNouveau} onChange={(e) => { setPwdNouveau(e.target.value); setPwdError(""); }} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: C.taupe }}>Confirmer</label>
                <input type="password" placeholder="Repetez le mot de passe" value={pwdConfirm} onChange={(e) => { setPwdConfirm(e.target.value); setPwdError(""); }} style={inputStyle} />
              </div>
            </div>

            {/* Message d'erreur validation */}
            {pwdError && (
              <div className="flex items-center gap-2 rounded-lg" style={{ padding: "10px 12px", backgroundColor: C.terraSoft, border: `1px solid ${C.terra}` }}>
                <AlertCircle size={15} style={{ color: C.terra, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: C.terra, fontWeight: 500 }}>{pwdError}</span>
              </div>
            )}

            <SaveButton onSave={savePassword} label="Modifier le mot de passe" />
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
