// ============================================================
// Panneau d'une tournee
//
// Le manifeste ne se compose que sur une tournee PLANIFIEE. Au depart,
// chaque colis passe EN_TRANSIT par la machine a etats du colis ; ceux
// qu'elle refuse reviennent dans `colisRefuses` et sont affiches, parce
// qu'un colis reste a quai est une information d'exploitation.
// ============================================================

"use client";

import { useState, useEffect } from "react";
import {
  X, Truck, User, Calendar, ArrowRight, Trash2, Plus, Play, Flag, Ban, AlertCircle, Check,
} from "lucide-react";
import type { StatutColis } from "@/lib/statuts";
import { statutConfig, statutTourneeConfig } from "@/lib/statuts";
import {
  useTournee, useUtilisateur, useColis,
  useAjouterColis, useRetirerColis, useDemarrerTournee, useTerminerTournee, useAnnulerTournee,
} from "@/lib/queries";
import { Bouton, Erreur, Chargement, Pastille, styleSaisie } from "@/components/ui";
import { StatutBadge } from "@/components/StatutBadge";
import { formatPoids, formatDateFr } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { C } from "@/lib/tokens";

/** Limite imposee par le backend sur la note de cloture. */
const NOTE_MAX = 300;

/** Seuls ces statuts sont embarquables, d'apres la regle du backend. */
const EMBARQUABLES: StatutColis[] = ["PRIS_EN_CHARGE", "ARRIVE_HUB"];

function Info({ icone: Icone, children }: { icone: typeof Truck; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icone size={14} strokeWidth={1.8} style={{ color: C.taupeLight, marginTop: "2px", flexShrink: 0 }} />
      <div style={{ fontSize: "13px", color: C.anthracite, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

function AjoutColis({ tourneeId, fermer }: { tourneeId: number; fermer: () => void }) {
  const mutation = useAjouterColis();
  const [statut, setStatut] = useState<StatutColis>("PRIS_EN_CHARGE");
  const [recherche, setRecherche] = useState("");
  const [choisis, setChoisis] = useState<number[]>([]);

  const { data, isLoading } = useColis({
    statut,
    parPage: 50,
    ...(recherche ? { recherche } : {}),
  });

  const candidats = data?.elements ?? [];

  const basculer = (id: number) =>
    setChoisis((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const ajouter = () =>
    mutation.mutate(
      { id: tourneeId, colisIds: choisis },
      { onSuccess: () => { setChoisis([]); fermer(); } },
    );

  return (
    <div className="rounded-xl" style={{ border: `1px solid ${C.border}`, backgroundColor: C.ivory, padding: "14px" }}>
      <div className="flex gap-2 mb-3 flex-wrap">
        <select
          value={statut}
          onChange={(e) => { setStatut(e.target.value as StatutColis); setChoisis([]); }}
          aria-label="Statut des colis a charger"
          style={{ ...styleSaisie, width: "auto", flex: "1 1 150px", minWidth: 0, fontSize: "12.5px" }}
        >
          {EMBARQUABLES.map((s) => (
            <option key={s} value={s}>{statutConfig(s).label}</option>
          ))}
        </select>
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value.slice(0, 60))}
          placeholder="Filtrer"
          aria-label="Filtrer les colis a charger"
          style={{ ...styleSaisie, flex: "1 1 120px", minWidth: 0, fontSize: "12.5px" }}
        />
      </div>

      <p style={{ fontSize: "11.5px", color: C.taupe, marginBottom: "10px", lineHeight: 1.5 }}>
        Seuls les colis pris en charge ou arrives au hub peuvent etre charges.
      </p>

      {isLoading && <Chargement texte="Recherche" />}

      {!isLoading && candidats.length === 0 && (
        <p style={{ fontSize: "12.5px", color: C.taupe }}>Aucun colis disponible avec ce statut.</p>
      )}

      {candidats.length > 0 && (
        <div className="space-y-1" style={{ maxHeight: "260px", overflowY: "auto" }}>
          {candidats.map((c) => {
            const coche = choisis.includes(c.id);
            return (
              <label
                key={c.id}
                className="flex items-center gap-3 rounded-lg"
                style={{
                  padding: "9px 11px", cursor: "pointer",
                  backgroundColor: coche ? C.emeraldSoft : C.white,
                  border: `1px solid ${coche ? C.emerald : C.border}`,
                }}
              >
                <input type="checkbox" checked={coche} onChange={() => basculer(c.id)} style={{ width: "17px", height: "17px", flexShrink: 0, accentColor: C.emerald }} />
                <span className="flex-1" style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: C.anthracite }}>
                    {c.tracking}
                  </span>
                  <span style={{ display: "block", fontSize: "11.5px", color: C.taupe, marginTop: "2px" }}>
                    {c.destinataireNom} {"·"} {c.destination.ville} {"·"} {formatPoids(c.poidsGrammes)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      {mutation.error && <div className="mt-3"><Erreur erreur={mutation.error} /></div>}

      <div className="flex gap-2 mt-3">
        <Bouton onClick={ajouter} disabled={choisis.length === 0 || mutation.isPending}>
          {mutation.isPending ? "Ajout" : `Charger ${choisis.length || ""}`.trim()}
        </Bouton>
        <Bouton variante="secondaire" onClick={fermer}>Fermer</Bouton>
      </div>
    </div>
  );
}

export function TourneePanel({ tourneeId, fermer }: { tourneeId: number | null; fermer: () => void }) {
  const { data: user } = useUtilisateur();
  const { data: tournee, isLoading, error } = useTournee(tourneeId);

  const retirer = useRetirerColis();
  const demarrer = useDemarrerTournee();
  const terminer = useTerminerTournee();
  const annuler = useAnnulerTournee();

  const [ajout, setAjout] = useState(false);
  const [refuses, setRefuses] = useState<string[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    setAjout(false);
    setRefuses([]);
    setNote("");
    demarrer.reset();
    terminer.reset();
    annuler.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourneeId]);

  useEffect(() => {
    if (tourneeId === null) return;
    const surTouche = (e: KeyboardEvent) => { if (e.key === "Escape") fermer(); };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [tourneeId, fermer]);

  if (tourneeId === null) return null;

  const pilote = user?.role === "DISPATCHER" || user?.role === "ADMIN";
  const roule = user?.role === "CHAUFFEUR" || pilote;
  const planifiee = tournee?.statut === "PLANIFIEE";
  const enCours = tournee?.statut === "EN_COURS";
  const composable = planifiee && pilote;

  const lancer = () =>
    demarrer.mutate(
      { id: tourneeId },
      { onSuccess: (resultat) => setRefuses(resultat.colisRefuses) },
    );

  const cloturer = () =>
    terminer.mutate({ id: tourneeId, note: note.trim() || undefined });

  // Une tournee hors de la portee du compte repond 404, comme si elle
  // n'existait pas. On le dit clairement plutot que d'afficher un echec.
  const introuvable = error instanceof ApiError && error.status === 404;

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={fermer} aria-hidden="true" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Detail de la tournee"
        className="fixed top-0 right-0 z-50 flex flex-col"
        style={{
          width: "100%", maxWidth: "520px", height: "100dvh",
          backgroundColor: C.white, borderLeft: `1px solid ${C.border}`,
          boxShadow: "-12px 0 32px rgba(11, 77, 63, 0.10)",
        }}
      >
        <div className="flex items-start justify-between gap-3 shrink-0" style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div className="min-w-0">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 600, color: C.anthracite }}>
              {tournee?.reference ?? "Chargement"}
            </div>
            {tournee && (
              <div className="mt-2">
                <Pastille
                  texte={statutTourneeConfig(tournee.statut).label}
                  fond={statutTourneeConfig(tournee.statut).bg}
                  couleur={statutTourneeConfig(tournee.statut).color}
                />
              </div>
            )}
          </div>
          <button
            onClick={fermer}
            aria-label="Fermer le panneau"
            className="rounded-lg shrink-0"
            style={{ color: C.taupe, background: "none", border: "none", cursor: "pointer", minWidth: "44px", minHeight: "44px" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: "20px" }}>
          {isLoading && <Chargement texte="Chargement de la tournee" />}
          {introuvable ? (
            <p style={{ fontSize: "13px", color: C.taupe, lineHeight: 1.6 }}>
              Cette tournee n&apos;existe pas, ou elle ne passe pas par ton agence.
            </p>
          ) : (
            <Erreur erreur={error} repli="Le detail de la tournee n'a pas pu etre charge." />
          )}

          {tournee && (
            <div className="space-y-6">
              <section className="space-y-3">
                <Info icone={ArrowRight}>
                  {tournee.ligne.origine.nom} vers {tournee.ligne.destination.nom}
                  <span style={{ color: C.taupe }}> ({tournee.ligne.libelle})</span>
                </Info>
                <Info icone={Calendar}>
                  Prevue le {formatDateFr(tournee.datePrevue)}
                  {tournee.departReel && <span style={{ color: C.taupe }}> {"·"} partie le {formatDateFr(tournee.departReel)}</span>}
                  {tournee.arriveeReelle && <span style={{ color: C.taupe }}> {"·"} arrivee le {formatDateFr(tournee.arriveeReelle)}</span>}
                </Info>
                <Info icone={Truck}>
                  {tournee.camion.immatriculation}
                  <span style={{ color: C.taupe }}>
                    {" "}{[tournee.camion.marque, tournee.camion.modele].filter(Boolean).join(" ")}
                  </span>
                </Info>
                <Info icone={User}>
                  {tournee.chauffeur.user.prenom} {tournee.chauffeur.user.nom}
                  <span style={{ color: C.taupe }}> {"·"} {tournee.chauffeur.user.telephone}</span>
                </Info>
              </section>

              <section className="rounded-xl" style={{ backgroundColor: C.ivory, border: `1px solid ${C.border}`, padding: "14px" }}>
                <div className="flex items-baseline justify-between gap-3">
                  <span style={{ fontSize: "12px", color: C.taupe }}>Chargement</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "15px", fontWeight: 600, color: C.anthracite }}>
                    {tournee.chargeKg.toLocaleString("fr-FR")} / {tournee.camion.capaciteKg.toLocaleString("fr-FR")} kg
                  </span>
                </div>
                <div className="mt-3 rounded-full" style={{ height: "6px", backgroundColor: C.sageDark, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, (tournee.chargeKg / tournee.camion.capaciteKg) * 100)}%`,
                      backgroundColor: tournee.capaciteRestanteKg < 0 ? C.terra : C.emerald,
                      transition: "width 200ms",
                    }}
                  />
                </div>
                <p style={{ fontSize: "11.5px", color: C.taupe, marginTop: "8px" }}>
                  {tournee.capaciteRestanteKg >= 0
                    ? `${tournee.capaciteRestanteKg.toLocaleString("fr-FR")} kg encore disponibles`
                    : "Capacite depassee"}
                </p>
              </section>

              <section>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: C.taupeLight }}>
                    Manifeste ({tournee.colis.length})
                  </h3>
                  {composable && !ajout && (
                    <Bouton variante="secondaire" onClick={() => setAjout(true)}>
                      <Plus size={14} /> Charger
                    </Bouton>
                  )}
                </div>

                {ajout && (
                  <div className="mb-3">
                    <AjoutColis tourneeId={tournee.id} fermer={() => setAjout(false)} />
                  </div>
                )}

                {tournee.colis.length === 0 ? (
                  <p style={{ fontSize: "12.5px", color: C.taupe, lineHeight: 1.6 }}>
                    Le manifeste est vide. Une tournee sans colis ne peut pas partir.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {tournee.colis.map((entree) => (
                      <div
                        key={entree.id}
                        className="flex items-center gap-3 rounded-lg"
                        style={{ border: `1px solid ${C.border}`, padding: "10px 12px" }}
                      >
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: C.taupeLight, width: "20px", flexShrink: 0 }}>
                          {entree.ordre}
                        </span>
                        <div className="flex-1" style={{ minWidth: 0 }}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: C.anthracite }}>
                              {entree.colis.tracking}
                            </span>
                            <StatutBadge statut={entree.colis.statut} taille="petite" />
                          </div>
                          <div style={{ fontSize: "11.5px", color: C.taupe, marginTop: "2px" }}>
                            {entree.colis.destinataireNom} {"·"} {entree.colis.destination.ville} {"·"} {formatPoids(entree.colis.poidsGrammes)}
                          </div>
                        </div>
                        {composable && (
                          <button
                            onClick={() => retirer.mutate({ id: tournee.id, colisId: entree.colis.id })}
                            disabled={retirer.isPending}
                            aria-label={`Retirer ${entree.colis.tracking} du manifeste`}
                            style={{ background: "none", border: "none", color: C.taupeLight, cursor: "pointer", minWidth: "40px", minHeight: "40px", flexShrink: 0 }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {retirer.error && <div className="mt-2"><Erreur erreur={retirer.error} /></div>}
              </section>

              <section>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: C.taupeLight, marginBottom: "12px" }}>
                  Cycle de vie
                </h3>

                {refuses.length > 0 && (
                  <div role="alert" className="rounded-lg mb-3" style={{ backgroundColor: C.warningSoft, padding: "12px" }}>
                    <div className="flex items-start gap-2">
                      <AlertCircle size={15} style={{ color: C.warning, marginTop: "1px", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: "12.5px", fontWeight: 600, color: C.warning }}>
                          La tournee est partie, mais {refuses.length} colis n&apos;ont pas pu etre charges.
                        </p>
                        <ul style={{ fontSize: "11.5px", color: C.taupe, marginTop: "6px", paddingLeft: "16px", lineHeight: 1.6 }}>
                          {refuses.map((r) => <li key={r}>{r}</li>)}
                        </ul>
                        <p style={{ fontSize: "11.5px", color: C.taupe, marginTop: "6px", lineHeight: 1.5 }}>
                          Ils restent a quai : verifie leur statut sur l&apos;ecran des colis.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {terminer.isSuccess && (
                  <div role="status" className="flex items-center gap-2 rounded-lg mb-3" style={{ backgroundColor: C.emeraldSoft, padding: "10px 12px" }}>
                    <Check size={15} style={{ color: C.emerald, flexShrink: 0 }} />
                    <span style={{ fontSize: "12.5px", color: C.emerald }}>
                      Tournee terminee, le camion est redevenu disponible.
                    </span>
                  </div>
                )}

                {tournee.noteCloture && (
                  <div className="rounded-lg mb-3" style={{ backgroundColor: C.ivory, border: `1px solid ${C.border}`, padding: "12px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: C.taupe, marginBottom: "4px" }}>
                      Note de cloture
                    </div>
                    <p style={{ fontSize: "13px", color: C.anthracite, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {tournee.noteCloture}
                    </p>
                  </div>
                )}

                {enCours && roule && (
                  <div className="mb-3">
                    <label htmlFor="note-cloture" style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.anthracite, marginBottom: "6px" }}>
                      Note de cloture <span style={{ fontWeight: 400, color: C.taupe }}>(facultative)</span>
                    </label>
                    <textarea
                      id="note-cloture"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={NOTE_MAX}
                      rows={3}
                      placeholder="Exemple : panne a Yamoussoukro, 3 colis reportes"
                      style={{ ...styleSaisie, width: "100%", resize: "vertical", minHeight: "72px" }}
                    />
                    <div style={{ fontSize: "11px", color: C.taupeLight, textAlign: "right", marginTop: "2px" }}>
                      {note.length} / {NOTE_MAX}
                    </div>
                  </div>
                )}

                <Erreur erreur={demarrer.error || terminer.error || annuler.error} />

                <div className="flex flex-wrap gap-2 mt-3">
                  {planifiee && roule && (
                    <Bouton onClick={lancer} disabled={demarrer.isPending || tournee.colis.length === 0}>
                      <Play size={14} /> {demarrer.isPending ? "Depart" : "Demarrer"}
                    </Bouton>
                  )}
                  {enCours && roule && (
                    <Bouton onClick={cloturer} disabled={terminer.isPending}>
                      <Flag size={14} /> {terminer.isPending ? "Cloture" : "Terminer"}
                    </Bouton>
                  )}
                  {planifiee && pilote && (
                    <Bouton variante="danger" onClick={() => annuler.mutate({ id: tournee.id })} disabled={annuler.isPending}>
                      <Ban size={14} /> {annuler.isPending ? "Annulation" : "Annuler"}
                    </Bouton>
                  )}
                  {!planifiee && !enCours && (
                    <p style={{ fontSize: "12.5px", color: C.taupe, lineHeight: 1.6 }}>
                      Cette tournee est cloturee. Son manifeste reste consultable.
                    </p>
                  )}
                </div>

                {enCours && (
                  <p style={{ fontSize: "11.5px", color: C.taupe, marginTop: "12px", lineHeight: 1.6 }}>
                    Terminer la tournee libere le camion. Les colis ne changent pas
                    de statut pour autant : c&apos;est l&apos;agent du relais d&apos;arrivee qui
                    constate la reception, colis par colis.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
