// ============================================================
// SENI CORP — Page "Nouveau colis"
// Formulaire en 4 etapes :
//   1. Trajet (point relais de depart et d'arrivee)
//   2. Service (retrait au relais ou livraison a domicile)
//   3. Details du colis (poids, contenu)
//   4. Destinataire + paiement
//
// Le prix et le numero de suivi viennent du serveur, jamais d'ici.
// Le solde est debite par le backend, en transaction atomique.
// ============================================================

"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Package, User, CreditCard, ChevronRight, ChevronLeft,
  Check, Truck, Home, CheckCircle2, Copy, AlertTriangle
} from "lucide-react";
import {
  ApiError, calculerPrix, creerColis,
  type ColisCree, type PointRelais,
} from "@/lib/api";
import { LABELS_PAIEMENT, type ModePaiement, type TypeService } from "@/lib/statuts";
import { usePointsRelais, useProfil, cles } from "@/lib/queries";
import { C } from "@/lib/tokens";

// Les 4 etapes du formulaire
const STEPS = [
  { id: 1, label: "Trajet",       icon: MapPin },
  { id: 2, label: "Service",      icon: Truck },
  { id: 3, label: "Colis",        icon: Package },
  { id: 4, label: "Destinataire", icon: User },
];

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
  minHeight: "48px",
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

// -- Select de point relais, groupe par ville --
function SelectRelais({ relais, value, onChange, exclureId, placeholder, ariaLabel }: {
  relais: PointRelais[];
  value: number | null;
  onChange: (id: number | null) => void;
  exclureId?: number | null;
  placeholder: string;
  ariaLabel: string;
}) {
  // Regroupe par ville pour que la liste reste lisible quand les relais se multiplient
  const parVille = useMemo(() => {
    const map = new Map<string, PointRelais[]>();
    relais
      .filter((r) => r.id !== exclureId)
      .forEach((r) => {
        const liste = map.get(r.ville) ?? [];
        liste.push(r);
        map.set(r.ville, liste);
      });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "fr"));
  }, [relais, exclureId]);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      style={inputStyle}
      aria-label={ariaLabel}
    >
      <option value="">{placeholder}</option>
      {parVille.map(([ville, liste]) => (
        <optgroup key={ville} label={ville}>
          {liste.map((r) => (
            <option key={r.id} value={r.id}>{r.nom}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}


// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function NouveauColisPage() {
  const queryClient = useQueryClient();
  const { data: profil } = useProfil();
  const { data: relais, isPending: relaisPending, isError: relaisError } = usePointsRelais();

  // Etat du formulaire
  const [step, setStep] = useState(1);
  const [origineId, setOrigineId] = useState<number | null>(null);
  const [destinationId, setDestinationId] = useState<number | null>(null);
  const [service, setService] = useState<TypeService>("RELAIS");
  const [poids, setPoids] = useState("");
  const [contenu, setContenu] = useState("");
  const [nomDest, setNomDest] = useState("");
  const [telDest, setTelDest] = useState("");
  const [adresseDest, setAdresseDest] = useState("");
  const [modePaiement, setModePaiement] = useState<ModePaiement>("CINETPAY");
  const [showConfirm, setShowConfirm] = useState(false);
  const [colisCree, setColisCree] = useState<ColisCree | null>(null);
  const [codeCopie, setCodeCopie] = useState(false);

  const solde = profil?.soldeCompte ?? 0;

  const origine = relais?.find((r) => r.id === origineId) ?? null;
  const destination = relais?.find((r) => r.id === destinationId) ?? null;

  // -- Validation stricte du poids saisi --
  const poidsNum = parseFloat(poids.replace(",", "."));
  const poidsValide = Number.isFinite(poidsNum) && poidsNum >= 0.1 && poidsNum <= 50;

  // -- Debounce : la saisie du poids ne doit pas declencher un appel par --
  // -- caractere. Taper "12,5" ferait 4 requetes, et l'endpoint tarif    --
  // -- est plafonne a 60 requetes par minute.                            --
  const [poidsDebounce, setPoidsDebounce] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setPoidsDebounce(poids), 400);
    return () => clearTimeout(t);
  }, [poids]);

  const poidsDebounceNum = parseFloat(poidsDebounce.replace(",", "."));
  const peutCalculer =
    !!origine && !!destination &&
    Number.isFinite(poidsDebounceNum) && poidsDebounceNum >= 0.1 && poidsDebounceNum <= 50;

  // -- Tarif : calcule par le serveur, jamais ici --
  const tarifQuery = useQuery({
    queryKey: ["tarif", origine?.ville, destination?.ville, poidsDebounceNum, service],
    queryFn: () => calculerPrix(origine!.ville, destination!.ville, poidsDebounceNum, service),
    enabled: peutCalculer,
    retry: false,
  });

  const tarif = peutCalculer ? tarifQuery.data ?? null : null;
  const tarifLoading = peutCalculer && tarifQuery.isFetching;

  // Un trajet absent de la grille renvoie 404 : on le dit clairement
  const tarifErreur = useMemo(() => {
    const err = tarifQuery.error;
    if (!peutCalculer || !err) return "";
    if (err instanceof ApiError && err.status === 404) {
      return `Aucun tarif pour ${origine?.ville} → ${destination?.ville}. Ce trajet n'est pas encore desservi.`;
    }
    return err instanceof ApiError ? err.message : "Tarif indisponible, reessaie.";
  }, [tarifQuery.error, peutCalculer, origine, destination]);

  // -- Creation du colis : c'est le backend qui debite le solde --
  const creation = useMutation({
    mutationFn: creerColis,
    onSuccess: (colis) => {
      setColisCree(colis);
      // Le solde et la liste des colis ont change cote serveur
      queryClient.invalidateQueries({ queryKey: cles.profil });
      queryClient.invalidateQueries({ queryKey: ["colis"] });
      queryClient.invalidateQueries({ queryKey: ["clients", "transactions"] });
    },
  });

  const adresseRequise = service === "DOMICILE";

  // -- Validation : peut-on passer a l'etape suivante ? --
  const canNext =
    step === 1 ? !!origineId && !!destinationId && origineId !== destinationId
    : step === 2 ? true
    : step === 3 ? poidsValide
    : !!nomDest.trim() && !!telDest.trim() && (!adresseRequise || !!adresseDest.trim());

  const soldeInsuffisant = modePaiement === "SOLDE" && tarif !== null && solde < tarif.montant;

  const [payError, setPayError] = useState("");

  const handlePay = () => {
    if (soldeInsuffisant) {
      setPayError(
        `Solde insuffisant : ${solde.toLocaleString("fr")} XOF disponibles pour ` +
        `${tarif!.montant.toLocaleString("fr")} XOF. Recharge ton compte ou choisis CinetPay.`
      );
      return;
    }
    setPayError("");
    creation.reset();
    setShowConfirm(true);
  };

  const confirmPayment = () => {
    if (!origineId || !destinationId || !poidsValide) return;
    creation.mutate({
      origineId,
      destinationId,
      destinataireNom: nomDest.trim(),
      destinataireTel: telDest.trim(),
      ...(adresseRequise ? { destinataireAdresse: adresseDest.trim() } : {}),
      poids: poidsNum,
      ...(contenu.trim() ? { description: contenu.trim() } : {}),
      service,
      modePaiement,
    });
  };

  const resetForm = () => {
    setShowConfirm(false);
    setColisCree(null);
    setCodeCopie(false);
    setStep(1);
    setDestinationId(null);
    setPoids("");
    setNomDest("");
    setTelDest("");
    setAdresseDest("");
    setContenu("");
    setPayError("");
    creation.reset();
  };

  const erreurCreation = creation.error instanceof ApiError ? creation.error : null;

  // -- Moyens de paiement --
  // CinetPay agrege Wave + Orange Money + Carte bancaire
  const PAYMENT_METHODS: { id: ModePaiement; label: string; desc: string }[] = [
    { id: "SOLDE",    label: LABELS_PAIEMENT.SOLDE,    desc: `Debiter du solde (${solde.toLocaleString("fr")} XOF)` },
    { id: "CINETPAY", label: LABELS_PAIEMENT.CINETPAY, desc: "Wave, Orange Money ou carte bancaire" },
    { id: "COD",      label: LABELS_PAIEMENT.COD,      desc: "Le destinataire paie au retrait" },
  ];

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
              relaisPending ? (
                <p style={{ fontSize: "13px", color: C.taupe }}>Chargement des points relais...</p>
              ) : relaisError ? (
                <p style={{ fontSize: "13px", color: C.terra }}>
                  Impossible de charger les points relais. Reessaie dans un instant.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Point relais de depart">
                    <SelectRelais
                      relais={relais ?? []}
                      value={origineId}
                      onChange={(id) => {
                        setOrigineId(id);
                        if (destinationId === id) setDestinationId(null);
                      }}
                      exclureId={destinationId}
                      placeholder="Choisir un relais"
                      ariaLabel="Point relais de depart"
                    />
                  </Field>
                  <Field label="Point relais de destination">
                    <SelectRelais
                      relais={relais ?? []}
                      value={destinationId}
                      onChange={setDestinationId}
                      exclureId={origineId}
                      placeholder="Choisir un relais"
                      ariaLabel="Point relais de destination"
                    />
                  </Field>
                </div>
              )
            )}

            {/* -- ETAPE 2 : Service -- */}
            {step === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "RELAIS" as const,   icon: MapPin, name: "Point relais",         desc: "Le destinataire retire son colis au relais." },
                  { id: "DOMICILE" as const, icon: Home,   name: "Livraison a domicile", desc: "Le colis est livre chez le destinataire." },
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
                      <p style={{ fontSize: "12px", color: C.taupe, lineHeight: 1.5 }}>{opt.desc}</p>
                    </button>
                  );
                })}
                {/* Le supplement domicile est calcule par le serveur : on ne l'annonce
                    pas en dur ici, il apparait dans le recapitulatif une fois le tarif recu. */}
              </div>
            )}

            {/* -- ETAPE 3 : Details du colis -- */}
            {step === 3 && (
              <div className="space-y-4">
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
                {poids && !poidsValide && (
                  <p style={{ fontSize: "11px", color: C.terra }}>
                    Le poids doit etre compris entre 0,1 et 50 kg.
                  </p>
                )}
                <Field label="Description du contenu (optionnel)">
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

                {/* Adresse : obligatoire uniquement pour la livraison a domicile */}
                {adresseRequise && (
                  <Field label="Adresse de livraison">
                    <input
                      type="text"
                      autoComplete="street-address"
                      placeholder="Quartier, rue, reperes..."
                      value={adresseDest}
                      onChange={(e) => setAdresseDest(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                )}

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
                        onClick={() => { setModePaiement(pm.id); setPayError(""); }}
                        className="text-left rounded-xl p-4"
                        style={{
                          border: `2px solid ${modePaiement === pm.id ? C.emerald : C.border}`,
                          backgroundColor: modePaiement === pm.id ? C.emeraldSoft : C.ivory,
                          cursor: "pointer",
                          minHeight: "44px",
                        }}
                        aria-pressed={modePaiement === pm.id}
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
                {adresseRequise
                  ? "Renseigne le nom, le telephone et l'adresse du destinataire pour continuer."
                  : "Renseigne le nom et le telephone du destinataire pour continuer."}
              </p>
            )}

            {/* Erreur de calcul du tarif */}
            {step === 4 && tarifErreur && (
              <p style={{ fontSize: "11px", color: C.terra, marginTop: "16px" }}>
                {tarifErreur}
              </p>
            )}

            {/* Refus de paiement (solde insuffisant, verifie cote client puis serveur) */}
            {step === 4 && payError && (
              <p style={{ fontSize: "11px", color: C.terra, marginTop: "16px" }}>
                {payError}
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
                  disabled={!canNext || tarif === null || tarifLoading}
                  className="flex items-center gap-2 rounded-lg"
                  style={{
                    padding: "10px 20px", fontSize: "13px", fontWeight: 600,
                    cursor: canNext && tarif !== null && !tarifLoading ? "pointer" : "not-allowed",
                    backgroundColor: canNext && tarif !== null && !tarifLoading ? C.bronze : C.sage,
                    color: canNext && tarif !== null && !tarifLoading ? C.white : C.taupeLight,
                    border: "none", fontFamily: "var(--font-heading)",
                    minHeight: "44px",
                  }}
                >
                  <CreditCard size={15} />
                  {tarifLoading ? "Calcul du tarif..." : "Payer"}
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
              { label: "Origine",      value: origine ? `${origine.nom} (${origine.ville})` : "—" },
              { label: "Destination",  value: destination ? `${destination.nom} (${destination.ville})` : "—" },
              { label: "Service",      value: service === "RELAIS" ? "Point relais" : "Domicile" },
              { label: "Poids",        value: poids ? `${poids} kg` : "—" },
              { label: "Destinataire", value: nomDest || "—" },
              { label: "Paiement",     value: LABELS_PAIEMENT[modePaiement] },
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

            {/* Detail du prix, tel que renvoye par le serveur */}
            {tarif && (
              <>
                <div className="flex justify-between py-2.5 gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", fontSize: "12px" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>Transport</span>
                  <span style={{ color: C.white, fontWeight: 500 }}>{tarif.montantTransport.toLocaleString("fr")} XOF</span>
                </div>
                {tarif.montantSupplement > 0 && (
                  <div className="flex justify-between py-2.5 gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", fontSize: "12px" }}>
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>Supplement domicile</span>
                    <span style={{ color: C.white, fontWeight: 500 }}>{tarif.montantSupplement.toLocaleString("fr")} XOF</span>
                  </div>
                )}
              </>
            )}

            <div className="rounded-xl text-center mt-5" style={{ backgroundColor: "rgba(184, 147, 90, 0.2)", padding: "16px" }}>
              <div style={{
                fontFamily: "var(--font-heading)", fontSize: "10px",
                color: C.bronzeLight, letterSpacing: "1.5px",
                textTransform: "uppercase", marginBottom: "6px",
              }}>
                Total a payer
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 800, color: C.white }}>
                {tarifLoading ? "..." : tarif ? tarif.montant.toLocaleString("fr") : "—"}
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
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", overflowY: "auto" }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="rounded-2xl w-full"
            style={{ maxWidth: "420px", backgroundColor: C.white, overflow: "hidden" }}
          >
            {colisCree ? (
              // Succes : le colis existe en base, le serveur a fixe le tracking
              <div className="p-7">
                <div className="text-center">
                  <CheckCircle2 size={52} style={{ color: C.success, margin: "0 auto 14px" }} />
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 700, color: C.anthracite, marginBottom: "6px" }}>
                    Colis enregistre
                  </div>
                  <div style={{ fontSize: "13px", color: C.taupe }}>
                    {colisCree.montant.toLocaleString("fr")} XOF — {LABELS_PAIEMENT[colisCree.modePaiement]}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: C.emerald, margin: "14px 0" }}>
                    {colisCree.tracking}
                  </div>
                </div>

                {/* -- Code de retrait : affiche UNE SEULE FOIS -- */}
                <div
                  className="rounded-xl"
                  style={{ backgroundColor: C.warningSoft, border: `1px solid ${C.warning}`, padding: "16px" }}
                >
                  <div className="flex items-center gap-2" style={{ marginBottom: "8px" }}>
                    <AlertTriangle size={15} style={{ color: C.warning, flexShrink: 0 }} />
                    <span style={{
                      fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "1px", color: C.warning,
                    }}>
                      Code de retrait
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-3" style={{ marginBottom: "10px" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 700,
                      letterSpacing: "4px", color: C.anthracite,
                    }}>
                      {colisCree.codeRetrait}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(colisCree.codeRetrait);
                        setCodeCopie(true);
                      }}
                      aria-label="Copier le code de retrait"
                      className="rounded-md"
                      style={{
                        padding: "6px 10px", fontSize: "11px", fontWeight: 600,
                        backgroundColor: C.warning, color: C.white, border: "none",
                        cursor: "pointer", minHeight: "32px",
                        display: "inline-flex", alignItems: "center", gap: "5px",
                      }}
                    >
                      <Copy size={13} />
                      {codeCopie ? "Copie" : "Copier"}
                    </button>
                  </div>
                  <p style={{ fontSize: "12px", color: C.taupe, lineHeight: 1.6 }}>
                    Note-le maintenant : il n'est affiche qu&apos;une seule fois et ne pourra
                    plus etre recupere. Le destinataire devra le donner a l&apos;agent pour
                    retirer le colis.
                  </p>
                </div>

                <button
                  onClick={resetForm}
                  className="w-full rounded-lg mt-5"
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
              // Confirmation avant creation
              <div className="p-6">
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.anthracite, marginBottom: "16px" }}>
                  Confirmer le paiement
                </div>
                <div className="rounded-xl text-center mb-4" style={{ backgroundColor: C.emeraldSoft, padding: "14px" }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: "24px", fontWeight: 800, color: C.emerald }}>
                    {tarif!.montant.toLocaleString("fr")} XOF
                  </div>
                  <div style={{ fontSize: "12px", color: C.taupe, marginTop: "4px" }}>
                    via {LABELS_PAIEMENT[modePaiement]}
                  </div>
                </div>
                <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "16px", lineHeight: 1.6 }}>
                  {origine?.ville} vers {destination?.ville} — {nomDest}
                </p>

                {/* Erreur renvoyee par le serveur (solde insuffisant, validation...) */}
                {erreurCreation && (
                  <div
                    className="rounded-lg mb-4"
                    style={{ backgroundColor: C.terraSoft, border: `1px solid ${C.terra}`, padding: "10px 12px" }}
                    role="alert"
                  >
                    {erreurCreation.messages.map((m, i) => (
                      <p key={i} style={{ fontSize: "12px", color: C.terra, fontWeight: 500, lineHeight: 1.5 }}>{m}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={creation.isPending}
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
                    disabled={creation.isPending}
                    className="flex-1 rounded-lg"
                    style={{
                      padding: "12px", border: "none",
                      backgroundColor: C.emerald, color: C.white,
                      fontFamily: "var(--font-heading)",
                      fontSize: "13px", fontWeight: 600,
                      cursor: creation.isPending ? "wait" : "pointer",
                      opacity: creation.isPending ? 0.7 : 1,
                      minHeight: "44px",
                    }}
                  >
                    {creation.isPending ? "Traitement..." : "Confirmer"}
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
