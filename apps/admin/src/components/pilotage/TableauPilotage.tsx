// ============================================================
// Ecran de pilotage : les blocs d'affichage
//
// Ce composant ne charge rien : il recoit la reponse de
// GET /statistiques/reseau et la met en forme. La page gere la periode,
// le chargement et les erreurs.
//
// Couleurs des series : l'emeraude claire et le bronze de la marque. Le
// bronze est pale sur fond blanc, donc chaque graphique ecrit aussi ses
// valeurs en clair (etiquettes, legende chiffree ou tableau).
// ============================================================

"use client";

import { useState, type ReactNode } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { StatistiquesReseau, ModePaiementStat } from "@/lib/api";
import type { StatutColis } from "@/lib/statuts";
import { statutConfig } from "@/lib/statuts";
import { C } from "@/lib/tokens";
import { nombre, xof, pourcent, duree, jourCourt, jourLong } from "./format";

/** Les deux series, dans un ordre fixe partout sur l'ecran. */
const SERIE_A = C.emeraldLight;
const SERIE_B = C.bronze;

const LIBELLE_MODE: Record<ModePaiementStat, string> = {
  SOLDE: "Solde du compte",
  CINETPAY: "CinetPay",
  COD: "Paiement a la livraison",
};

/** Colis en mouvement, dans l'ordre du parcours. */
const EN_COURS: StatutColis[] = ["CREE", "PRIS_EN_CHARGE", "EN_TRANSIT", "ARRIVE_HUB", "EN_ATTENTE_RETRAIT", "EN_LIVRAISON"];
const EXCEPTIONS: StatutColis[] = ["INCIDENT", "PERDU", "RETOURNE", "ANNULE"];

// ------------------------------------------------------------
// Briques
// ------------------------------------------------------------

function Bloc({ titre, note, action, children }: {
  titre: string; note?: string; action?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="rounded-xl min-w-0" style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "18px 16px 20px" }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 600, color: C.anthracite, lineHeight: 1.3 }}>
            {titre}
          </h3>
          {note && <p style={{ fontSize: "12px", color: C.taupe, marginTop: "3px", lineHeight: 1.5 }}>{note}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Indicateur({ libelle, valeur, detail }: { libelle: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-xl min-w-0" style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "14px 16px" }}>
      <div style={{ fontSize: "12px", color: C.taupe }}>{libelle}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px, 5.5vw, 30px)", overflowWrap: "anywhere", fontWeight: 600, color: C.anthracite, lineHeight: 1.15, marginTop: "6px" }}>
        {valeur}
      </div>
      {detail && <div style={{ fontSize: "11.5px", color: C.taupe, marginTop: "6px", lineHeight: 1.45 }}>{detail}</div>}
    </div>
  );
}

/** Legende : une pastille de couleur a cote d'un texte a l'encre normale. */
function Legende({ items }: { items: { couleur: string; libelle: string; valeur?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5">
      {items.map((it) => (
        <div key={it.libelle} className="flex items-center gap-2" style={{ fontSize: "12px", color: C.anthracite }}>
          <span aria-hidden="true" style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: it.couleur, flexShrink: 0 }} />
          {it.libelle}
          {it.valeur && <span style={{ color: C.taupe, fontVariantNumeric: "tabular-nums" }}>{it.valeur}</span>}
        </div>
      ))}
    </div>
  );
}

function BoutonTexte({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: "none", border: "none", padding: "4px 0", color: C.emerald, fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", minHeight: "32px" }}
    >
      {children}
    </button>
  );
}

const styleCellule = { padding: "8px 10px", fontSize: "12.5px", borderBottom: `1px solid ${C.border}` } as const;
const styleEntete = { ...styleCellule, fontSize: "11px", fontWeight: 600, color: C.taupe, textAlign: "left" as const };
const chiffres = { textAlign: "right" as const, fontVariantNumeric: "tabular-nums" as const };

function InfoBulle({ titre, lignes }: { titre: string; lignes: { couleur: string; libelle: string; valeur: string }[] }) {
  return (
    <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "8px 10px", boxShadow: "0 4px 14px rgba(11,77,63,0.10)" }}>
      <div style={{ fontSize: "11.5px", fontWeight: 600, color: C.anthracite, marginBottom: "4px" }}>{titre}</div>
      {lignes.map((l) => (
        <div key={l.libelle} className="flex items-center gap-2" style={{ fontSize: "12px", color: C.anthracite, lineHeight: 1.6 }}>
          <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: l.couleur }} />
          <span style={{ color: C.taupe }}>{l.libelle}</span>
          <span style={{ marginLeft: "auto", paddingLeft: "12px", fontVariantNumeric: "tabular-nums" }}>{l.valeur}</span>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// Blocs
// ------------------------------------------------------------

function Volume({ stats }: { stats: StatistiquesReseau }) {
  const [tableau, setTableau] = useState(false);
  const jours = stats.volume.parJour;

  return (
    <Bloc
      titre="Colis par jour"
      note="Un colis compte le jour de sa creation, puis le jour de sa livraison."
      action={<BoutonTexte onClick={() => setTableau((t) => !t)}>{tableau ? "Voir le graphique" : "Voir le tableau"}</BoutonTexte>}
    >
      <div className="mb-3">
        <Legende items={[
          { couleur: SERIE_A, libelle: "Crees", valeur: nombre(stats.volume.colisCrees) },
          { couleur: SERIE_B, libelle: "Livres", valeur: nombre(stats.volume.colisLivres) },
        ]} />
      </div>

      {tableau ? (
        <div style={{ maxHeight: "280px", overflowY: "auto" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, backgroundColor: C.white }}>
              <tr><th style={styleEntete}>Jour</th><th style={{ ...styleEntete, ...chiffres }}>Crees</th><th style={{ ...styleEntete, ...chiffres }}>Livres</th></tr>
            </thead>
            <tbody>
              {jours.map((j) => (
                <tr key={j.date}>
                  <td style={{ ...styleCellule, color: C.anthracite }}>{jourLong(j.date)}</td>
                  <td style={{ ...styleCellule, ...chiffres }}>{nombre(j.crees)}</td>
                  <td style={{ ...styleCellule, ...chiffres }}>{nombre(j.livres)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ width: "100%", height: "240px" }}>
          <ResponsiveContainer>
            <AreaChart data={jours} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid vertical={false} stroke={C.border} strokeWidth={1} />
              <XAxis
                dataKey="date" tickFormatter={jourCourt} minTickGap={24}
                tick={{ fill: C.taupe, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false}
              />
              <YAxis allowDecimals={false} width={40} tick={{ fill: C.taupe, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ stroke: C.borderStrong, strokeWidth: 1 }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <InfoBulle
                      titre={jourLong(String(label))}
                      lignes={[
                        { couleur: SERIE_A, libelle: "Crees", valeur: nombre(Number(payload[0]?.payload.crees ?? 0)) },
                        { couleur: SERIE_B, libelle: "Livres", valeur: nombre(Number(payload[0]?.payload.livres ?? 0)) },
                      ]}
                    />
                  ) : null
                }
              />
              <Area type="linear" dataKey="crees" name="Crees" stroke={SERIE_A} strokeWidth={2} fill={SERIE_A} fillOpacity={0.1}
                dot={false} activeDot={{ r: 4, fill: SERIE_A, stroke: C.white, strokeWidth: 2 }} isAnimationActive={false} />
              <Area type="linear" dataKey="livres" name="Livres" stroke={SERIE_B} strokeWidth={2} fill={SERIE_B} fillOpacity={0.1}
                dot={false} activeDot={{ r: 4, fill: SERIE_B, stroke: C.white, strokeWidth: 2 }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Bloc>
  );
}

function CompteurStatut({ statut, nombre: n }: { statut: StatutColis; nombre: number }) {
  const cfg = statutConfig(statut);
  return (
    <div className="rounded-lg min-w-0" style={{ border: `1px solid ${C.border}`, padding: "10px 12px", opacity: n === 0 ? 0.55 : 1 }}>
      <div className="flex items-center gap-1.5" style={{ fontSize: "11.5px", color: C.taupe }}>
        <span aria-hidden="true" style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: cfg.color, flexShrink: 0 }} />
        {cfg.label}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 600, color: C.anthracite, marginTop: "2px" }}>
        {nombre(n)}
      </div>
    </div>
  );
}

export function EtatReseau({ stats }: { stats: StatistiquesReseau }) {
  const parStatut = new Map(stats.pipeline.map((p) => [p.statut, p.nombre]));
  const enMouvement = EN_COURS.reduce((s, st) => s + (parStatut.get(st) ?? 0), 0);

  return (
    <Bloc
      titre="Etat du reseau en ce moment"
      note={`${nombre(enMouvement)} colis en cours d'acheminement. Ces compteurs ne dependent pas de la periode choisie.`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {EN_COURS.map((s) => <CompteurStatut key={s} statut={s} nombre={parStatut.get(s) ?? 0} />)}
      </div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: C.taupe, margin: "16px 0 8px" }}>A traiter</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {EXCEPTIONS.map((s) => <CompteurStatut key={s} statut={s} nombre={parStatut.get(s) ?? 0} />)}
      </div>
      <p style={{ fontSize: "12px", color: C.taupe, marginTop: "12px" }}>
        {nombre(parStatut.get("LIVRE") ?? 0)} colis livres depuis l&apos;ouverture du reseau.
      </p>
    </Bloc>
  );
}

function Finances({ stats }: { stats: StatistiquesReseau }) {
  const { chiffreAffaires: ca, encaisse, aEncaisser, parModePaiement } = stats.finances;
  const partEncaisse = ca > 0 ? encaisse / ca : 0;

  return (
    <Bloc titre="Finances" note="Montant des colis crees sur la periode.">
      <div style={{ fontSize: "12px", color: C.taupe }}>Chiffre d&apos;affaires</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 6vw, 30px)", fontWeight: 600, color: C.anthracite, lineHeight: 1.2, overflowWrap: "anywhere" }}>
        {xof(ca)}
      </div>

      {/* Encaisse contre a encaisser : deux segments separes par un trait de fond */}
      <div className="flex mt-4" style={{ height: "14px", gap: ca > 0 && encaisse > 0 && aEncaisser > 0 ? "2px" : 0 }}
        role="img" aria-label={`Encaisse ${pourcent(partEncaisse)}, reste ${pourcent(1 - partEncaisse)}`}>
        {ca === 0 ? (
          <div className="flex-1" style={{ backgroundColor: C.sage, borderRadius: "4px" }} />
        ) : (
          <>
            {encaisse > 0 && <div style={{ flex: encaisse, backgroundColor: SERIE_A, borderRadius: aEncaisser > 0 ? "4px 0 0 4px" : "4px" }} />}
            {aEncaisser > 0 && <div style={{ flex: aEncaisser, backgroundColor: SERIE_B, borderRadius: encaisse > 0 ? "0 4px 4px 0" : "4px" }} />}
          </>
        )}
      </div>
      <div className="mt-3">
        <Legende items={[
          { couleur: SERIE_A, libelle: "Encaisse", valeur: `${xof(encaisse)} (${pourcent(partEncaisse)})` },
          { couleur: SERIE_B, libelle: "A encaisser", valeur: `${xof(aEncaisser)} (${pourcent(ca > 0 ? 1 - partEncaisse : 0)})` },
        ]} />
      </div>

      <table className="w-full mt-5" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={styleEntete}>Mode de paiement</th>
            <th style={{ ...styleEntete, ...chiffres }}>Colis</th>
            <th style={{ ...styleEntete, ...chiffres }}>Montant</th>
          </tr>
        </thead>
        <tbody>
          {parModePaiement.map((m) => (
            <tr key={m.mode}>
              <td style={{ ...styleCellule, color: C.anthracite }}>{LIBELLE_MODE[m.mode] ?? m.mode}</td>
              <td style={{ ...styleCellule, ...chiffres }}>{nombre(m.nombre)}</td>
              <td style={{ ...styleCellule, ...chiffres }}>{xof(m.montant)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Bloc>
  );
}

function Qualite({ stats }: { stats: StatistiquesReseau }) {
  const q = stats.qualite;
  const base = stats.volume.colisCrees;
  const taux = [
    { libelle: "Incidents", valeur: q.tauxIncident },
    { libelle: "Pertes", valeur: q.tauxPerte },
    { libelle: "Retours", valeur: q.tauxRetour },
  ];

  return (
    <Bloc titre="Qualite de service" note="Part des colis crees sur la periode qui ont connu un incident, une perte ou un retour.">
      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={styleEntete}>Sur {nombre(base)} colis crees</th>
            <th style={{ ...styleEntete, ...chiffres }}>Taux</th>
          </tr>
        </thead>
        <tbody>
          {taux.map((t) => (
            <tr key={t.libelle}>
              <td style={{ ...styleCellule, color: C.anthracite }}>{t.libelle}</td>
              <td style={{ ...styleCellule, ...chiffres }}>{pourcent(t.valeur)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Bloc>
  );
}

function Agences({ stats }: { stats: StatistiquesReseau }) {
  const actives = stats.agences.filter((a) => a.auDepart > 0 || a.aLArrivee > 0);
  const calmes = stats.agences.length - actives.length;
  const donnees = actives.map((a) => ({ ...a, etiquette: a.nom.replace(/^SENI CORP\s+/, "") }));

  return (
    <Bloc titre="Activite par agence" note="Un colis compte au depart dans son agence d'origine et a l'arrivee dans son agence de destination.">
      <div className="mb-3">
        <Legende items={[{ couleur: SERIE_A, libelle: "Au depart" }, { couleur: SERIE_B, libelle: "A l'arrivee" }]} />
      </div>

      {actives.length === 0 ? (
        <p style={{ fontSize: "12.5px", color: C.taupe }}>Aucune agence n&apos;a eu d&apos;activite sur la periode.</p>
      ) : (
        <div style={{ width: "100%", height: `${donnees.length * 52 + 16}px` }}>
          <ResponsiveContainer>
            <BarChart data={donnees} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }} barGap={2} barCategoryGap="22%">
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="etiquette" width={112} tick={{ fill: C.anthracite, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: C.ivory }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <InfoBulle
                      titre={`${payload[0].payload.nom} (${payload[0].payload.ville})`}
                      lignes={[
                        { couleur: SERIE_A, libelle: "Au depart", valeur: nombre(payload[0].payload.auDepart) },
                        { couleur: SERIE_B, libelle: "A l'arrivee", valeur: nombre(payload[0].payload.aLArrivee) },
                      ]}
                    />
                  ) : null
                }
              />
              <Bar dataKey="auDepart" fill={SERIE_A} barSize={12} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey="auDepart" position="right" style={{ fill: C.taupe, fontSize: 11 }} />
              </Bar>
              <Bar dataKey="aLArrivee" fill={SERIE_B} barSize={12} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey="aLArrivee" position="right" style={{ fill: C.taupe, fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {calmes > 0 && actives.length > 0 && (
        <p style={{ fontSize: "12px", color: C.taupe, marginTop: "8px" }}>
          {calmes} {calmes > 1 ? "agences n'ont eu aucune activite" : "agence n'a eu aucune activite"} sur la periode.
        </p>
      )}
    </Bloc>
  );
}

function Tournees({ stats }: { stats: StatistiquesReseau }) {
  const t = stats.tournees;
  const nonParties = Math.max(0, t.total - t.partiesALHeure - t.partiesEnRetard);
  const remplissage = Math.min(1, t.tauxRemplissageMoyen);

  const lignes = [
    { libelle: "Tournees prevues", valeur: t.total },
    { libelle: "Terminees", valeur: t.terminees },
    { libelle: "Annulees", valeur: t.annulees },
    { libelle: "Parties a l'heure", valeur: t.partiesALHeure },
    { libelle: "Parties en retard", valeur: t.partiesEnRetard },
    { libelle: "Pas encore parties", valeur: nonParties },
  ];

  return (
    <Bloc titre="Tournees">
      <div style={{ fontSize: "12px", color: C.taupe }}>Remplissage moyen des camions</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "30px", fontWeight: 600, color: C.anthracite, lineHeight: 1.2 }}>
        {t.total === 0 ? "Pas de mesure" : pourcent(t.tauxRemplissageMoyen)}
      </div>
      <div className="mt-3 rounded-full" style={{ height: "10px", backgroundColor: C.emeraldSoft, overflow: "hidden" }}
        role="img" aria-label={`Remplissage moyen ${pourcent(t.tauxRemplissageMoyen)}`}>
        <div style={{ height: "100%", width: `${remplissage * 100}%`, minWidth: remplissage > 0 ? "4px" : 0, backgroundColor: SERIE_A, borderRadius: "999px" }} />
      </div>
      <p style={{ fontSize: "11.5px", color: C.taupe, marginTop: "6px", lineHeight: 1.5 }}>
        Poids transporte par rapport a la capacite du camion. Les tournees sans colis ne comptent pas.
      </p>

      <table className="w-full mt-4" style={{ borderCollapse: "collapse" }}>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.libelle}>
              <td style={{ ...styleCellule, color: C.anthracite }}>{l.libelle}</td>
              <td style={{ ...styleCellule, ...chiffres }}>{nombre(l.valeur)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: "11.5px", color: C.taupe, marginTop: "8px", lineHeight: 1.5 }}>
        Sur une ligne sans heure de depart, le retard se compte au jour pres. Renseigne l&apos;heure dans l&apos;ecran Lignes pour le mesurer en minutes.
      </p>
    </Bloc>
  );
}

function Chauffeurs({ stats }: { stats: StatistiquesReseau }) {
  return (
    <Bloc titre="Chauffeurs" note="Classes par nombre de colis transportes.">
      {stats.chauffeurs.length === 0 ? (
        <p style={{ fontSize: "12.5px", color: C.taupe }}>Aucun chauffeur n&apos;a roule sur la periode.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="w-full" style={{ borderCollapse: "collapse", minWidth: "320px" }}>
            <thead>
              <tr>
                <th style={styleEntete}>Chauffeur</th>
                <th style={{ ...styleEntete, ...chiffres }}>Tournees</th>
                <th style={{ ...styleEntete, ...chiffres }}>Colis transportes</th>
              </tr>
            </thead>
            <tbody>
              {stats.chauffeurs.map((c) => (
                <tr key={c.chauffeurId}>
                  <td style={{ ...styleCellule, color: C.anthracite, fontWeight: 500 }}>{c.nom}</td>
                  <td style={{ ...styleCellule, ...chiffres }}>{nombre(c.tournees)}</td>
                  <td style={{ ...styleCellule, ...chiffres }}>{nombre(c.colisTransportes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Bloc>
  );
}

// ------------------------------------------------------------
// Assemblage
// ------------------------------------------------------------

export function periodeVide(stats: StatistiquesReseau): boolean {
  return stats.volume.colisCrees === 0 && stats.volume.colisLivres === 0 && stats.tournees.total === 0;
}

export function TableauPilotage({ stats }: { stats: StatistiquesReseau }) {
  const q = stats.qualite;

  if (periodeVide(stats)) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl" style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "28px 24px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: C.anthracite }}>Aucune activite sur cette periode</p>
          <p style={{ fontSize: "12.5px", color: C.taupe, marginTop: "6px" }}>
            Aucun colis cree ni livre, et aucune tournee prevue. Choisis une autre periode.
          </p>
        </div>
        <EtatReseau stats={stats} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Indicateur libelle="Colis crees" valeur={nombre(stats.volume.colisCrees)} />
        <Indicateur libelle="Colis livres" valeur={nombre(stats.volume.colisLivres)} />
        <Indicateur
          libelle="Delai moyen de livraison"
          valeur={q.colisMesures === 0 ? "Pas de mesure" : duree(q.delaiMoyenHeures)}
          detail={q.colisMesures === 0 ? "Aucune livraison sur la periode" : `Mediane ${duree(q.delaiMedianHeures)}, sur ${nombre(q.colisMesures)} colis`}
        />
        <Indicateur libelle="Chiffre d'affaires" valeur={xof(stats.finances.chiffreAffaires)} />
      </div>

      <Volume stats={stats} />
      <EtatReseau stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Finances stats={stats} />
        <Qualite stats={stats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Agences stats={stats} />
        <Tournees stats={stats} />
      </div>

      <Chauffeurs stats={stats} />
    </div>
  );
}
