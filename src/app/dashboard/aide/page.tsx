// ============================================================
// SENI CORP — Page "Aide"
// FAQ, contact support, guides rapides.
// Chemin : src/app/dashboard/aide/page.tsx
// ============================================================

"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, BookOpen, Package, CreditCard, Truck } from "lucide-react";

const C = {
  emerald: "#0B4D3F", emeraldLight: "#1A6B58", emeraldSoft: "#E8F0ED",
  bronze: "#B8935A", bronzeLight: "#D4B486", bronzeSoft: "#F5EFE3",
  ivory: "#FAF6F0", sage: "#E8EDE5", anthracite: "#1A1A1A",
  taupe: "#6B6259", taupeLight: "#9B8A7E", border: "#EAE3D5", white: "#FFFFFF",
};

const FAQ = [
  { question: "Comment envoyer un colis ?", answer: "Cliquez sur \"Nouveau colis\" dans le menu, remplissez les 4 etapes (trajet, service, colis, destinataire), puis payez. Votre colis sera pris en charge dans les 24 heures.", icon: Package },
  { question: "Comment suivre un colis ?", answer: "Allez dans \"Mes colis\" pour voir le statut de tous vos envois. Vous pouvez aussi partager le lien de suivi public avec votre destinataire.", icon: Truck },
  { question: "Comment recharger mon compte ?", answer: "Allez dans \"Paiements\", choisissez un montant et cliquez sur \"Recharger via CinetPay\". Vous pouvez payer par Wave, Orange Money ou carte bancaire. La recharge est instantanee.", icon: CreditCard },
  { question: "Que faire si mon colis est en retard ?", answer: "Consultez le suivi en temps reel dans \"Mes colis\". Si le retard depasse 48 heures, contactez notre support via WhatsApp.", icon: HelpCircle },
  { question: "Comment fonctionne le COD ?", answer: "Lors de la creation du colis, activez l'option COD et indiquez le montant. Le destinataire paie au point relais. Le montant vous est reverse sous 24 heures.", icon: CreditCard },
  { question: "Comment obtenir une facture ?", answer: "Les factures sont generees automatiquement chaque mois. Allez dans \"Factures\" pour les consulter et les telecharger au format PDF.", icon: BookOpen },
];

function FaqItem({ item }: { item: typeof FAQ[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, marginBottom: "8px" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 text-left" aria-expanded={open}
        style={{ padding: "16px 20px", cursor: "pointer", background: "none", border: "none" }}>
        <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: "36px", height: "36px", backgroundColor: open ? C.emeraldSoft : C.sage, color: open ? C.emerald : C.taupe }}><Icon size={17} /></div>
        <span className="flex-1" style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: 600, color: C.anthracite }}>{item.question}</span>
        {open ? <ChevronUp size={18} style={{ color: C.taupe }} /> : <ChevronDown size={18} style={{ color: C.taupe }} />}
      </button>
      {open && <div style={{ padding: "0 20px 16px 69px", fontSize: "13px", color: C.taupe, lineHeight: 1.7 }}>{item.answer}</div>}
    </div>
  );
}

export default function AidePage() {
  const whatsappNumber = "22507000000";
  const whatsappMessage = encodeURIComponent("Bonjour, j'ai besoin d'aide avec mon compte SENI CORP.");

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 max-w-[900px] mx-auto">
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: 700, color: C.anthracite, marginBottom: "6px" }}>Centre d'aide</h1>
      <p style={{ fontSize: "13px", color: C.taupe, marginBottom: "28px" }}>Trouvez des reponses ou contactez notre equipe.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <a href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"
          className="rounded-xl text-center block" style={{ backgroundColor: C.emeraldSoft, padding: "20px", border: `1px solid ${C.border}`, textDecoration: "none" }}>
          <MessageCircle size={24} style={{ color: C.emerald, margin: "0 auto 10px" }} />
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 700, color: C.anthracite, marginBottom: "4px" }}>WhatsApp</div>
          <div style={{ fontSize: "12px", color: C.taupe }}>+225 07 00 00 00</div>
        </a>
        <a href="tel:+22527220000" className="rounded-xl text-center block" style={{ backgroundColor: C.bronzeSoft, padding: "20px", border: `1px solid ${C.border}`, textDecoration: "none" }}>
          <Phone size={24} style={{ color: C.bronze, margin: "0 auto 10px" }} />
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 700, color: C.anthracite, marginBottom: "4px" }}>Telephone</div>
          <div style={{ fontSize: "12px", color: C.taupe }}>+225 27 22 00 00</div>
        </a>
        <a href="mailto:support@seni-corp.ci" className="rounded-xl text-center block" style={{ backgroundColor: C.emeraldSoft, padding: "20px", border: `1px solid ${C.border}`, textDecoration: "none" }}>
          <Mail size={24} style={{ color: C.emeraldLight, margin: "0 auto 10px" }} />
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 700, color: C.anthracite, marginBottom: "4px" }}>Email</div>
          <div style={{ fontSize: "12px", color: C.taupe }}>support@seni-corp.ci</div>
        </a>
      </div>

      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: 700, color: C.anthracite, marginBottom: "16px" }}>Questions frequentes</h2>
      <div>{FAQ.map((item, i) => <FaqItem key={i} item={item} />)}</div>

      <div className="rounded-2xl text-center mt-8" style={{ backgroundColor: C.emerald, padding: "32px" }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: 700, color: C.white, marginBottom: "8px" }}>Vous n'avez pas trouve votre reponse ?</h3>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginBottom: "16px" }}>Notre equipe est disponible du lundi au samedi, de 8h a 18h.</p>
        <a href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg" style={{ padding: "10px 24px", backgroundColor: C.bronze, color: C.white, fontFamily: "var(--font-heading)", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
          <MessageCircle size={16} />Contacter le support
        </a>
      </div>
      <div className="h-8" />
    </div>
  );
}