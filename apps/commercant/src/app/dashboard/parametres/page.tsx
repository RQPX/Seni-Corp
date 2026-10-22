// ============================================================
// SENI CORP — Page "Parametres"
// Profil, entreprise, securite. Tout vient de l'API et y retourne.
//
// PATCH /clients/profil n'accepte ni soldeCompte, ni typeClient, ni
// role : c'est ce qui empeche un client de s'auto-crediter. Ne pas
// tenter de les envoyer.
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Building2, Bell, Shield, Save, Check, AlertCircle } from "lucide-react";
import { ApiError, changerMotDePasse, majProfil, type MajProfilData } from "@/lib/api";
import { validerMotDePasse } from "@/lib/motDePasse";
import { cles, useProfil, useUtilisateur } from "@/lib/queries";
import { C } from "@/lib/tokens";

// -- Style commun des champs de formulaire --
// fontSize 16px = evite le zoom automatique sur iOS au focus
// minHeight 48px = cible tactile confortable au doigt
const inputStyle: React.CSSProperties = {
  padding: "12px 14px", fontSize: "16px", borderRadius: "10px",
  backgroundColor: C.ivory, border: `1px solid ${C.border}`,
  color: C.anthracite, fontFamily: "var(--font-body)",
  outline: "none", width: "100%",
  minHeight: "48px",
};

const inputLectureSeule: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: C.sage,
  color: C.taupe,
  cursor: "not-allowed",
};

const labelStyle: React.CSSProperties = {
  fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
  letterSpacing: "0.5px", color: C.taupe,
};

const TABS = [
  { id: "profil",        label: "Profil",        icon: User },
  { id: "entreprise",    label: "Entreprise",    icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "securite",      label: "Securite",      icon: Shield },
];

function Erreur({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg" style={{ padding: "10px 12px", backgroundColor: C.terraSoft, border: `1px solid ${C.terra}` }} role="alert">
      <AlertCircle size={15} style={{ color: C.terra, flexShrink: 0, marginTop: "1px" }} />
      <div>
        {messages.map((m, i) => (
          <p key={i} style={{ fontSize: "12px", color: C.terra, fontWeight: 500, lineHeight: 1.5 }}>{m}</p>
        ))}
      </div>
    </div>
  );
}

function SaveButton({ onClick, enCours, succes, label = "Enregistrer" }: {
  onClick: () => void; enCours: boolean; succes: boolean; label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={enCours}
      className="flex items-center gap-2 rounded-lg transition-colors"
      style={{
        padding: "10px 20px",
        backgroundColor: succes ? C.emeraldSoft : C.emerald,
        color: succes ? C.emerald : C.white,
        border: succes ? `1px solid ${C.emerald}` : "none",
        fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600,
        cursor: enCours ? "wait" : "pointer",
        opacity: enCours ? 0.7 : 1,
        minHeight: "44px",
      }}
    >
      {succes ? <Check size={15} /> : <Save size={15} />}
      {enCours ? "Enregistrement..." : succes ? "Enregistre !" : label}
    </button>
  );
}

export default function ParametresPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profil");

  const { data: user } = useUtilisateur();
  const { data: profil } = useProfil();

  // --- Onglet Profil ---
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [ville, setVille] = useState("");

  // --- Onglet Entreprise ---
  const [nomBoutique, setNomBoutique] = useState("");

  // Remplit les champs des que le profil arrive
  useEffect(() => {
    if (!profil) return;
    setNom(profil.user.nom);
    setPrenom(profil.user.prenom);
    setTelephone(profil.user.telephone);
    setVille(profil.ville ?? "");
    setNomBoutique(profil.nomBoutique ?? "");
  }, [profil]);

  const majProfilMutation = useMutation({
    mutationFn: (data: MajProfilData) => majProfil(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cles.profil });
      queryClient.invalidateQueries({ queryKey: cles.moi });
    },
  });

  // --- Onglet Securite ---
  const [pwdActuel, setPwdActuel] = useState("");
  const [pwdNouveau, setPwdNouveau] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdErreurs, setPwdErreurs] = useState<string[]>([]);

  const motDePasseMutation = useMutation({
    mutationFn: () => changerMotDePasse(pwdActuel, pwdNouveau),
    onSuccess: () => {
      setPwdActuel(""); setPwdNouveau(""); setPwdConfirm("");
      setPwdErreurs([]);
    },
    onError: (err) => {
      setPwdErreurs(err instanceof ApiError ? err.messages : ["Impossible de modifier le mot de passe."]);
    },
  });

  const savePassword = () => {
    const erreurs = validerMotDePasse(pwdNouveau, {
      nom: profil?.user.nom,
      prenom: profil?.user.prenom,
      email: profil?.user.email,
    });
    if (!pwdActuel) erreurs.unshift("Entrez votre mot de passe actuel.");
    if (pwdNouveau !== pwdConfirm) erreurs.push("Les deux mots de passe ne correspondent pas.");
    if (erreurs.length > 0) { setPwdErreurs(erreurs); return; }
    setPwdErreurs([]);
    motDePasseMutation.mutate();
  };

  const erreursProfil = majProfilMutation.error instanceof ApiError
    ? majProfilMutation.error.messages
    : [];

  const estEntreprise = profil?.typeClient === "ENTREPRISE";

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
              <div className="flex items-center justify-center rounded-full shrink-0" style={{
                width: "56px", height: "56px",
                background: `linear-gradient(135deg, ${C.bronze}, ${C.bronzeLight})`,
                fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.white,
              }}>
                {`${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase() || "--"}
              </div>
              <div className="min-w-0">
                <div style={{ fontSize: "16px", fontWeight: 600, color: C.anthracite }}>
                  {prenom} {nom}
                </div>
                <div style={{ fontSize: "12px", color: C.taupe }}>{profil?.user.email ?? user?.email ?? ""}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>Prenom</label>
                <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>Nom</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>Telephone</label>
                <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>Ville</label>
                <input type="text" value={ville} onChange={(e) => setVille(e.target.value)} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label style={labelStyle}>Email</label>
                <input type="email" value={profil?.user.email ?? ""} readOnly style={inputLectureSeule} />
                <span style={{ fontSize: "11px", color: C.taupeLight }}>
                  L&apos;email sert d&apos;identifiant de connexion : contacte le support pour le changer.
                </span>
              </div>
            </div>

            <Erreur messages={erreursProfil} />

            <SaveButton
              onClick={() => majProfilMutation.mutate({ nom, prenom, telephone, ville })}
              enCours={majProfilMutation.isPending}
              succes={majProfilMutation.isSuccess}
            />
          </div>
        )}

        {/* ENTREPRISE */}
        {activeTab === "entreprise" && (
          <div className="space-y-5">
            {estEntreprise ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label style={labelStyle}>Nom commercial</label>
                  <input type="text" value={nomBoutique} onChange={(e) => setNomBoutique(e.target.value)} style={inputStyle} />
                </div>

                <Erreur messages={erreursProfil} />

                <SaveButton
                  onClick={() => majProfilMutation.mutate({ nomBoutique })}
                  enCours={majProfilMutation.isPending}
                  succes={majProfilMutation.isSuccess}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <Building2 size={30} style={{ color: C.border, margin: "0 auto 10px" }} />
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600, color: C.taupe }}>
                  Compte particulier
                </p>
                <p style={{ fontSize: "12px", color: C.taupeLight, marginTop: "4px" }}>
                  Les informations d&apos;entreprise ne concernent que les comptes professionnels.
                </p>
              </div>
            )}
          </div>
        )}

        {/* NOTIFICATIONS — aucun endpoint backend a ce jour */}
        {activeTab === "notifications" && (
          <div className="text-center py-10">
            <Bell size={30} style={{ color: C.border, margin: "0 auto 12px" }} />
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 600, color: C.anthracite }}>
              Bientot disponible
            </p>
            <p style={{ fontSize: "12.5px", color: C.taupe, marginTop: "6px", lineHeight: 1.6, maxWidth: "440px", margin: "6px auto 0" }}>
              Le reglage des alertes SMS et email sera active des que le service de
              notifications sera en place cote serveur.
            </p>
          </div>
        )}

        {/* SECURITE */}
        {activeTab === "securite" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label style={labelStyle}>Mot de passe actuel</label>
              <input
                type="password" autoComplete="current-password"
                placeholder="Entrez votre mot de passe actuel"
                value={pwdActuel}
                onChange={(e) => { setPwdActuel(e.target.value); setPwdErreurs([]); }}
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>Nouveau mot de passe</label>
                <input
                  type="password" autoComplete="new-password"
                  placeholder="12 caracteres minimum"
                  value={pwdNouveau}
                  onChange={(e) => { setPwdNouveau(e.target.value); setPwdErreurs([]); }}
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label style={labelStyle}>Confirmer</label>
                <input
                  type="password" autoComplete="new-password"
                  placeholder="Repetez le mot de passe"
                  value={pwdConfirm}
                  onChange={(e) => { setPwdConfirm(e.target.value); setPwdErreurs([]); }}
                  style={inputStyle}
                />
              </div>
            </div>

            <p style={{ fontSize: "11.5px", color: C.taupeLight, lineHeight: 1.6 }}>
              12 caracteres minimum, avec au moins 3 types de caracteres (minuscule,
              majuscule, chiffre, symbole). Un mot de passe de 16 caracteres ou plus est
              aussi accepte. Changer le mot de passe deconnecte toutes tes autres sessions.
            </p>

            <Erreur messages={pwdErreurs} />

            {motDePasseMutation.isSuccess && (
              <div className="flex items-center gap-2 rounded-lg" style={{ padding: "10px 12px", backgroundColor: C.emeraldSoft, border: `1px solid ${C.emerald}` }} role="status">
                <Check size={15} style={{ color: C.emerald, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: C.emerald, fontWeight: 500 }}>
                  Mot de passe modifie. Tes autres sessions ont ete deconnectees.
                </span>
              </div>
            )}

            <SaveButton
              onClick={savePassword}
              enCours={motDePasseMutation.isPending}
              succes={motDePasseMutation.isSuccess}
              label="Modifier le mot de passe"
            />
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
