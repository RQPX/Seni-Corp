// ============================================================
// SENI CORP — Page "Nouveau colis"
// Formulaire en 4 etapes pour creer un colis :
//   1. Trajet (ville de depart et d'arrivee)
//   2. Service (retrait au relais ou livraison a domicile)
//   3. Details du colis (poids, taille, contenu)
//   4. Destinataire + paiement
// A la fin : confirmation et generation du numero de suivi.
// ============================================================

"use client";

import { useState } from "react";
import {
  MapPin, Package, User, CreditCard, ChevronRight, ChevronLeft,
  Check, Truck, Home, CheckCircle2
} from "lucide-react";
import { useAppStore } from "@/store/appStore";

const C = {
  emerald: "#0B4D3F", emeraldDark: "#083528", emeraldSoft: "#E8F0ED",
  bronze: "#B8935A", bronzeLight: "#D4B486", bronzeSoft: "#F5EFE3",
  ivory: "#FAF6F0", sage: "#E8EDE5", anthracite: "#1A1A1A",
  taupe: "#6B6259", taupeLight: "#9B8A7E", border: "#EAE3D5",
  success: "#4A6B5C", white: "#FFFFFF",
};

// Villes desservies au demarrage
const VILLES = ["Abidjan", "Bouake", "Korhogo", "Yamoussoukro", "San-Pedro", "Daloa"];

// Tarifs de base par trajet (XOF)
// A remplacer par un appel API /tarifs/calculer plus tard
const TARIF_BASE: Record<string, number> = {
  "Abidjan-Bouake": 1800, "Abidjan-Korhogo": 2800, "Abidjan-Yamoussoukro": 1500,
  "Abidjan-San-Pedro": 2200, "Abidjan-Daloa": 2000, "Bouake-Korhogo": 1600,
  "Bouake-Yamoussoukro": 1200, "Korhogo-Abidjan": 2800, "Bouake-Abidjan": 1800,
  "San-Pedro-Abidjan": 2200,
};

// Les 4 etapes du formulaire
const STEPS = [
  { id: 1, label: "Trajet",       icon: MapPin },
  { id: 2, label: "Service",      icon: Truck },
  { id: 3, label: "Colis",        icon: Package },
  { id: 4, label: "Destinataire", icon: User },
];

// -- Genere un numero de suivi unique --
// Format : SC-2026-XXXXXX (6 caracteres alphanumeriques)
function genTracking(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // pas de I/O/0/1 (confusion visuelle)
  return 'SC-2026-' + Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// -- Style commun de tous les champs de formulaire --
const inputStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: "16px", // 16px pour eviter le zoom automatique sur iOS
  borderRadius: "10px",
  backgroundColor: C.ivory,
  border: `1px solid ${C.border}`,
  color: C.anthracite,
  fontFamily: "var(--font-body)",
  outline: "none",
  width: "100%",
  minHeight: "48px", // cible tactile confortable
};

// -- Composant Field : etiquette + contenu --
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{
        fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: 600,
        letterSpacing: "0.5px", textTransform: "uppercase", color: C.taupe,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}


// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function NouveauColisPage() {
  // Actions du store global
  const { solde, addColis, deductSolde } = useAppStore();

  // Etat du formulaire
  const [step, setStep] = useState(1);
  const [origine, setOrigine] = useState("Abidjan");
  const [destination, setDestination] = useState("");
  const [service, setService] = useState<"relais" | "domicile">("relais");
  const [poids, setPoids] = useState("");
  const [dimensions, setDimensions] = useState("moyen");
  const [contenu, setContenu] = useState("");
  const [nomDest, setNomDest] = useState("");
  const [telDest, setTelDest] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cinetpay");
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "loading" | "done">("idle");
  const [newTracking, setNewTracking] = useState("");

  // -- Moyens de paiement --
  // CinetPay agrege Wave + Orange Money + Carte bancaire
  // MTN MoMo est volontairement absent (non supporte)
  const PAYMENT_METHODS = [
    { id: "solde",    label: "Solde compte",              desc: `Debiter du solde (${solde.toLocaleString("fr")} XOF)` },
    { id: "cinetpay", label: "CinetPay",                   desc: "Wave, Orange Money ou carte bancaire" },
    { id: "cod",      label: "Paiement a la livraison",   desc: "Le destinataire paie au retrait" },
  ];

  // -- Calcule le tarif total --
  const calculerTarif = () => {
    if (!destination) return 0;
    const base = TARIF_BASE[`${origine}-${destination}`] || 2000;
    const supplement = service === "domicile" ? 1500 : 0;
    // Poids : au-dela de 2kg, on facture 200 XOF par kg supplementaire
    const poidsNum = parseFloat(poids.replace(",", ".")) || 1;
    const suppPoids = poidsNum > 2 ? Math.ceil(poidsNum - 2) * 200 : 0;
    return base + supplement + suppPoids;
  };

  const tarif = calculerTarif();

  // -- Validation : peut-on passer a l'etape suivante ? --
  const canNext = step === 1 ? !!destination && destination !== origine
    : step === 2 ? true
    : step === 3 ? !!poids
    : !!nomDest && !!telDest;

  // -- Ouvre la modale de confirmation de paiement --
  const handlePay = () => {
    setShowConfirm(true);
    setPaymentStatus("idle");
  };

  // -- Confirme le paiement et cree le colis --
  const confirmPayment = () => {
    setPaymentStatus("loading");
    const tracking = genTracking();

    // Simule le delai d'un appel API paiement
    // TODO : remplacer par un vrai appel API (Wave / CinetPay webhook)
    setTimeout(() => {
      addColis({
        tracking,
        origine,
        destination,
        destinataire: nomDest,
        telephone: telDest,
        statut: "cree",
        montant: tarif,
        createdAt: new Date().toISOString(),
        poids: `${poids} kg`,
        contenu: contenu || "Non specifie",
        service: service === "relais" ? "Point relais" : "Livraison domicile",
      });

      // Debite le solde uniquement si l'utilisateur a choisi cette option
      if (paymentMethod === "solde") {
        deductSolde(tarif, tracking);
      }

      setNewTracking(tracking);
      setPaymentStatus("done");
    }, 1500);
  };

  // -- Reset du formulaire apres succes --
  const resetForm = () => {
    setShowConfirm(false);
    setStep(1);
    setDestination("");
    setPoids("");
    setNomDest("");
    setTelDest("");
    setContenu("");
    setPaymentStatus("idle");
    setNewTracking("");
  };


  return (
    <div
      className="px-4 py-5 md:px-8 md:py-7 mx-auto"
      style={{ maxWidth: "1000px", width: "100%", minWidth: 0 }}
    >
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700, color: C.anthracite, marginBottom: "6px" }}>
        Nouveau colis
      </h1>
      <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "28px" }}>
        Remplis les informations pour envoyer un colis.
      </p>

      {/* -- Barre d'etapes (avec scroll horizontal si necessaire) -- */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;

          return (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "32px", height: "32px",
                    backgroundColor: isDone ? C.emerald : isActive ? C.bronze : C.sage,
                    color: isDone || isActive ? C.white : C.taupe,
                  }}
                >
                  {isDone ? <Check size={14} strokeWidth={3} /> : <Icon size={14} strokeWidth={2} />}
                </div>
                <span style={{
                  fontFamily: "var(--font-heading)", fontSize: "12px", fontWeight: 600,
                  color: isActive ? C.anthracite : C.taupe, whiteSpace: "nowrap",
                }}>
                  {s.label}
                </span>
              </div>
              {/* Trait de connexion entre les etapes */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    width: "32px", height: "2px",
                    backgroundColor: step > s.id ? C.emerald : C.border,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* -- Grille : formulaire (2/3) + recapitulatif (1/3) -- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2" style={{ minWidth: 0 }}>
          <div
            className="rounded-2xl"
            style={{
              backgroundColor: C.white, border: `1px solid ${C.border}`,
              padding: "24px", maxWidth: "100%",
            }}
          >
            <div style={{
              fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: 700,
              letterSpacing: "2px", textTransform: "uppercase",
              color: C.bronze, marginBottom: "4px",
            }}>
              Etape {step} / 4
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.anthracite, marginBottom: "24px" }}>
              {STEPS[step - 1].label}
            </h2>

            {/* -- ETAPE 1 : Trajet -- */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ville d'origine">
                  <select
                    value={origine}
                    onChange={(e) => setOrigine(e.target.value)}
                    style={inputStyle}
                    aria-label="Ville d'origine"
                  >
                    {VILLES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Ville de destination">
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    style={inputStyle}
                    aria-label="Ville de destination"
                  >
                    <option value="">Choisir une ville</option>
                    {VILLES.filter((v) => v !== origine).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            {/* -- ETAPE 2 : Service -- */}
            {step === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "relais" as const,   icon: MapPin, name: "Point relais",         desc: "Le destinataire retire son colis au relais.",  prix: "+ 0 XOF" },
                  { id: "domicile" as const, icon: Home,   name: "Livraison a domicile", desc: "Le colis est livre chez le destinataire.",     prix: "+ 1 500 XOF" },
                ].map((opt) => {
                  const isSelected = service === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setService(opt.id)}
                      className="text-left rounded-xl p-5"
                      style={{
                        border: `2px solid ${isSelected ? C.emerald : C.border}`,
                        backgroundColor: isSelected ? C.emeraldSoft : C.ivory,
                        cursor: "pointer",
                        minHeight: "44px",
                      }}
                      aria-pressed={isSelected}
                    >
                      <Icon size={28} style={{ color: isSelected ? C.emerald : C.taupe, marginBottom: "12px" }} />
                      <div style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 600, color: C.anthracite, marginBottom: "4px" }}>
                        {opt.name}
                      </div>
                      <p style={{ fontSize: "12px", color: C.taupe, lineHeight: 1.5, marginBottom: "10px" }}>{opt.desc}</p>
                      <div style={{
                        fontFamily: "var(--font-heading)", fontSize: "12px", fontWeight: 700,
                        color: isSelected ? C.emerald : C.bronze,
                      }}>
                        {opt.prix}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* -- ETAPE 3 : Details du colis -- */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Poids estime (kg)">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 2,5"
                      value={poids}
                      onChange={(e) => setPoids(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Taille du colis">
                    <select
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      style={inputStyle}
                      aria-label="Taille du colis"
                    >
                      <option value="petit">Petit (enveloppe)</option>
                      <option value="moyen">Moyen (boite a chaussures)</option>
                      <option value="grand">Grand (carton)</option>
                      <option value="volumineux">Volumineux (meuble)</option>
                    </select>
                  </Field>
                </div>
                <Field label="Description du contenu">
                  <textarea
                    placeholder="Decris le contenu..."
                    value={contenu}
                    onChange={(e) => setContenu(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                  />
                </Field>
              </div>
            )}

            {/* -- ETAPE 4 : Destinataire + paiement -- */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nom complet">
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="Nom du destinataire"
                      value={nomDest}
                      onChange={(e) => setNomDest(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Telephone">
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+225 07 89 12 34 56"
                      value={telDest}
                      onChange={(e) => setTelDest(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                </div>

                {/* Selection du moyen de paiement */}
                <div>
                  <div style={{
                    fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: 700,
                    letterSpacing: "2px", textTransform: "uppercase",
                    color: C.bronze, marginBottom: "4px", marginTop: "8px",
                  }}>
                    Moyen de paiement
                  </div>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 700, color: C.anthracite, marginBottom: "12px" }}>
                    Comment souhaites-tu payer ?
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PAYMENT_METHODS.map((pm) => (
                      <button
                        type="button"
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        className="text-left rounded-xl p-4"
                        style={{
                          border: `2px solid ${paymentMethod === pm.id ? C.emerald : C.border}`,
                          backgroundColor: paymentMethod === pm.id ? C.emeraldSoft : C.ivory,
                          cursor: "pointer",
                          minHeight: "44px",
                        }}
                        aria-pressed={paymentMethod === pm.id}
                      >
                        <div style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600, color: C.anthracite }}>
                          {pm.label}
                        </div>
                        <div style={{ fontSize: "11px", color: C.taupe, marginTop: "2px" }}>{pm.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message d'aide si l'etape 4 n'est pas complete */}
            {step === 4 && !canNext && (
              <p style={{ fontSize: "11px", color: C.taupeLight, marginTop: "16px" }}>
                Renseigne le nom et le telephone du destinataire pour continuer.
              </p>
            )}

            {/* -- Navigation entre etapes -- */}
            <div className="flex items-center justify-between mt-6 gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 rounded-lg"
                  style={{
                    padding: "10px 18px", fontSize: "13px", fontWeight: 600,
                    cursor: "pointer",
                    backgroundColor: "transparent",
                    border: `1px solid ${C.border}`,
                    color: C.taupe, fontFamily: "var(--font-heading)",
                    minHeight: "44px",
                  }}
                >
                  <ChevronLeft size={15} />
                  Retour
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => canNext && setStep(step + 1)}
                  disabled={!canNext}
                  className="flex items-center gap-2 rounded-lg"
                  style={{
                    padding: "10px 20px", fontSize: "13px", fontWeight: 600,
                    cursor: canNext ? "pointer" : "not-allowed",
                    backgroundColor: canNext ? C.emerald : C.sage,
                    color: canNext ? C.white : C.taupeLight,
                    border: "none", fontFamily: "var(--font-heading)",
                    minHeight: "44px",
                  }}
                >
                  Suivant <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={!canNext}
                  className="flex items-center gap-2 rounded-lg"
                  style={{
                    padding: "10px 20px", fontSize: "13px", fontWeight: 600,
                    cursor: canNext ? "pointer" : "not-allowed",
                    backgroundColor: canNext ? C.bronze : C.sage,
                    color: canNext ? C.white : C.taupeLight,
                    border: "none", fontFamily: "var(--font-heading)",
                    minHeight: "44px",
                  }}
                >
                  <CreditCard size={15} />
                  Payer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* -- Recapitulatif (sticky sur desktop) -- */}
        <div style={{ minWidth: 0 }}>
          <div
            className="rounded-2xl lg:sticky lg:top-4"
            style={{ backgroundColor: C.emerald, padding: "22px" }}
          >
            <h3 style={{
              fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: 700,
              letterSpacing: "2px", textTransform: "uppercase",
              color: C.bronzeLight, marginBottom: "18px",
            }}>
              Recapitulatif
            </h3>
            {[
              { label: "Origine",       value: origine },
              { label: "Destination",   value: destination || "\u2014" },
              { label: "Service",       value: service === "relais" ? "Point relais" : "Domicile" },
              { label: "Poids",         value: poids ? `${poids} kg` : "\u2014" },
              { label: "Destinataire",  value: nomDest || "\u2014" },
              { label: "Paiement",      value: PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label || "\u2014" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between py-2.5 gap-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", fontSize: "12px" }}
              >
                <span style={{ color: "rgba(255,255,255,0.6)", flexShrink: 0 }}>{row.label}</span>
                <span style={{
                  color: C.white, fontWeight: 500,
                  textAlign: "right", overflowWrap: "break-word",
                  minWidth: 0,
                }}>
                  {row.value}
                </span>
              </div>
            ))}
            <div className="rounded-xl text-center mt-5" style={{ backgroundColor: "rgba(184, 147, 90, 0.2)", padding: "16px" }}>
              <div style={{
                fontFamily: "var(--font-heading)", fontSize: "10px",
                color: C.bronzeLight, letterSpacing: "1.5px",
                textTransform: "uppercase", marginBottom: "6px",
              }}>
                Total a payer
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 800, color: C.white }}>
                {tarif > 0 ? tarif.toLocaleString("fr") : "\u2014"}
                <span style={{ fontSize: "14px", fontWeight: 500, color: C.bronzeLight, marginLeft: "6px" }}>
                  XOF
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -- Modale de confirmation / succes -- */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="rounded-2xl w-full"
            style={{ maxWidth: "400px", backgroundColor: C.white, overflow: "hidden" }}
          >
            {paymentStatus === "done" ? (
              // Succes : colis cree
              <div className="text-center p-8">
                <CheckCircle2 size={56} style={{ color: C.success, margin: "0 auto 16px" }} />
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 700, color: C.anthracite, marginBottom: "6px" }}>
                  Colis enregistre
                </div>
                <div style={{ fontSize: "13px", color: C.taupe, marginBottom: "4px" }}>
                  Paiement de {tarif.toLocaleString("fr")} XOF confirme via{" "}
                  {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}.
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: C.emerald, margin: "16px 0" }}>
                  {newTracking}
                </div>
                <p style={{ fontSize: "12px", color: C.taupeLight, marginBottom: "20px" }}>
                  Le destinataire recevra un SMS avec le lien de suivi.
                </p>
                <button
                  onClick={resetForm}
                  className="rounded-lg"
                  style={{
                    padding: "12px 24px", backgroundColor: C.emerald, color: C.white,
                    border: "none", fontFamily: "var(--font-heading)",
                    fontSize: "13px", fontWeight: 600, cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  Envoyer un autre colis
                </button>
              </div>
            ) : (
              // Confirmation avant paiement
              <div className="p-6">
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.anthracite, marginBottom: "16px" }}>
                  Confirmer le paiement
                </div>
                <div className="rounded-xl text-center mb-4" style={{ backgroundColor: C.emeraldSoft, padding: "14px" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 800, color: C.emerald }}>
                    {tarif.toLocaleString("fr")} XOF
                  </div>
                  <div style={{ fontSize: "12px", color: C.taupe, marginTop: "4px" }}>
                    via {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}
                  </div>
                </div>
                <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "20px", lineHeight: 1.6 }}>
                  {origine} vers {destination} — {nomDest}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 rounded-lg"
                    style={{
                      padding: "12px", border: `1px solid ${C.border}`,
                      backgroundColor: C.white, color: C.taupe,
                      fontFamily: "var(--font-heading)",
                      fontSize: "13px", fontWeight: 600, cursor: "pointer",
                      minHeight: "44px",
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmPayment}
                    disabled={paymentStatus === "loading"}
                    className="flex-1 rounded-lg"
                    style={{
                      padding: "12px", border: "none",
                      backgroundColor: C.emerald, color: C.white,
                      fontFamily: "var(--font-heading)",
                      fontSize: "13px", fontWeight: 600,
                      cursor: paymentStatus === "loading" ? "wait" : "pointer",
                      opacity: paymentStatus === "loading" ? 0.7 : 1,
                      minHeight: "44px",
                    }}
                  >
                    {paymentStatus === "loading" ? "Traitement..." : "Confirmer"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
