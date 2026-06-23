// ============================================================
// SENI CORP — Page "Factures"
// Liste des factures mensuelles avec telechargement PDF.
// Chemin : src/app/dashboard/factures/page.tsx
// ============================================================

"use client";

import { useState } from "react";
import { FileText, Download, Eye, Calendar, X, Printer } from "lucide-react";

const C = {
  emerald: "#0B4D3F", emeraldSoft: "#E8F0ED",
  bronze: "#B8935A", bronzeSoft: "#F5EFE3", bronzeLight: "#D4B486",
  ivory: "#FAF6F0", sage: "#E8EDE5", anthracite: "#1A1A1A",
  taupe: "#6B6259", border: "#EAE3D5", success: "#4A6B5C", white: "#FFFFFF",
};

const FACTURES = [
  { id: "FAC-2026-04", periode: "Avril 2026", colis: 234, montant: 468000, statut: "en_cours", lignes: [
    { desc: "Envois point relais (198 colis)", montant: 356400 },
    { desc: "Livraisons domicile (36 colis)", montant: 108000 },
    { desc: "Supplements poids > 2kg", montant: 3600 },
  ]},
  { id: "FAC-2026-03", periode: "Mars 2026", colis: 198, montant: 396000, statut: "payee", lignes: [
    { desc: "Envois point relais (170 colis)", montant: 306000 },
    { desc: "Livraisons domicile (28 colis)", montant: 84000 },
    { desc: "Supplements poids > 2kg", montant: 6000 },
  ]},
  { id: "FAC-2026-02", periode: "Fevrier 2026", colis: 156, montant: 312000, statut: "payee", lignes: [
    { desc: "Envois point relais (140 colis)", montant: 252000 },
    { desc: "Livraisons domicile (16 colis)", montant: 48000 },
    { desc: "Supplements poids > 2kg", montant: 12000 },
  ]},
  { id: "FAC-2026-01", periode: "Janvier 2026", colis: 89, montant: 178000, statut: "payee", lignes: [
    { desc: "Envois point relais (82 colis)", montant: 147600 },
    { desc: "Livraisons domicile (7 colis)", montant: 21000 },
    { desc: "Supplements poids > 2kg", montant: 9400 },
  ]},
];

// Genere un PDF via une fenetre d'impression du navigateur
function downloadPDF(facture: typeof FACTURES[0]) {
  const html = `<!DOCTYPE html><html><head><title>${facture.id}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #1A1A1A; }
  h1 { color: #0B4D3F; font-size: 28px; margin-bottom: 4px; }
  .subtitle { color: #B8935A; font-size: 14px; letter-spacing: 2px; margin-bottom: 32px; }
  .info { margin-bottom: 24px; font-size: 14px; color: #6B6259; line-height: 1.8; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { text-align: left; padding: 10px 12px; background: #E8EDE5; color: #6B6259; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; }
  td { padding: 12px; border-bottom: 1px solid #EAE3D5; font-size: 14px; }
  .amount { text-align: right; font-weight: 600; }
  .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #0B4D3F; color: #0B4D3F; }
  .footer { margin-top: 40px; font-size: 12px; color: #9B8A7E; text-align: center; }
  @media print { body { margin: 20px; } }
</style></head><body>
  <h1>SENI CORP</h1>
  <div class="subtitle">FACTURE</div>
  <div class="info">
    <strong>Numero :</strong> ${facture.id}<br>
    <strong>Periode :</strong> ${facture.periode}<br>
    <strong>Client :</strong> Mode Adjame — Seni N'Diaye<br>
    <strong>Statut :</strong> ${facture.statut === "payee" ? "Payee" : "En cours"}
  </div>
  <table>
    <thead><tr><th>Description</th><th class="amount">Montant</th></tr></thead>
    <tbody>
      ${facture.lignes.map(l => `<tr><td>${l.desc}</td><td class="amount">${l.montant.toLocaleString("fr")} XOF</td></tr>`).join("")}
      <tr class="total-row"><td>TOTAL</td><td class="amount">${facture.montant.toLocaleString("fr")} XOF</td></tr>
    </tbody>
  </table>
  <div class="footer">SENI CORP — Plateforme logistique<br>support@seni-corp.ci — +225 27 22 00 00</div>
  <script>window.onload = function() { window.print(); }</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

export default function FacturesPage() {
  const [viewFacture, setViewFacture] = useState<typeof FACTURES[0] | null>(null);

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 max-w-[1400px] mx-auto">
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700, color: C.anthracite, marginBottom: "6px" }}>Factures</h1>
      <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "28px" }}>Vos factures mensuelles consolidees.</p>

      <div className="space-y-4">
        {FACTURES.map((f) => {
          const enCours = f.statut === "en_cours";
          return (
            <div key={f.id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl" style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, padding: "20px 24px" }}>
              <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: "48px", height: "48px", backgroundColor: enCours ? C.bronzeSoft : C.emeraldSoft, color: enCours ? C.bronze : C.emerald }}><FileText size={22} /></div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: C.emerald }}>{f.id}</span>
                  <span className="rounded-full" style={{ padding: "3px 8px", fontSize: "10px", fontWeight: 600, fontFamily: "var(--font-heading)", backgroundColor: enCours ? C.bronzeSoft : C.emeraldSoft, color: enCours ? C.bronze : C.success }}>{enCours ? "En cours" : "Payee"}</span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5" style={{ fontSize: "12px", color: C.taupe }}><Calendar size={13} />{f.periode}</span>
                  <span style={{ fontSize: "12px", color: C.taupe }}>{f.colis} colis</span>
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 700, color: C.anthracite }}>{f.montant.toLocaleString("fr")}<span style={{ fontSize: "12px", fontWeight: 400, color: C.taupe, marginLeft: "4px" }}>XOF</span></div>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewFacture(f)} className="flex items-center gap-1.5 rounded-lg" style={{ padding: "8px 14px", fontSize: "12px", fontWeight: 600, backgroundColor: C.sage, border: `1px solid ${C.border}`, color: C.taupe, cursor: "pointer", fontFamily: "var(--font-heading)" }}><Eye size={14} />Voir</button>
                <button onClick={() => downloadPDF(f)} className="flex items-center gap-1.5 rounded-lg" style={{ padding: "8px 14px", fontSize: "12px", fontWeight: 600, backgroundColor: C.emerald, border: "none", color: C.white, cursor: "pointer", fontFamily: "var(--font-heading)" }}><Download size={14} />PDF</button>
              </div>
            </div>
          );
        })}
      </div>

      {viewFacture && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl w-full overflow-hidden" style={{ maxWidth: "520px", backgroundColor: C.white }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: C.emerald }}>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 700, color: C.white }}>Facture {viewFacture.id}</div>
                <div style={{ fontSize: "12px", color: C.bronzeLight, marginTop: "2px" }}>{viewFacture.periode}</div>
              </div>
              <button onClick={() => setViewFacture(null)} style={{ background: "none", border: "none", color: C.bronzeLight, cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div className="px-6 py-5">
              <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.5px", color: C.taupe, marginBottom: "12px" }}>Detail des lignes</div>
              {viewFacture.lignes.map((l, i) => (
                <div key={i} className="flex justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: "13px", color: C.anthracite }}>{l.desc}</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, color: C.anthracite, whiteSpace: "nowrap", marginLeft: "16px" }}>{l.montant.toLocaleString("fr")} XOF</span>
                </div>
              ))}
              <div className="flex justify-between pt-4 mt-2">
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 700, color: C.anthracite }}>Total</span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.emerald }}>{viewFacture.montant.toLocaleString("fr")} XOF</span>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => { downloadPDF(viewFacture); setViewFacture(null); }} className="flex-1 flex items-center justify-center gap-2 rounded-lg" style={{ padding: "10px", backgroundColor: C.emerald, color: C.white, border: "none", fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}><Download size={15} />Telecharger PDF</button>
              <button onClick={() => setViewFacture(null)} className="rounded-lg" style={{ padding: "10px 16px", backgroundColor: C.sage, border: `1px solid ${C.border}`, color: C.taupe, fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
      <div className="h-8" />
    </div>
  );
}