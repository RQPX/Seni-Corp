// Mise en forme des chiffres de l'ecran de pilotage.
// Les taux arrivent en fractions (0.023), les montants en entiers XOF.

const fr = (n: number, decimales = 0) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: decimales, minimumFractionDigits: 0 });

export const nombre = (n: number) => fr(n);

export const xof = (n: number) => `${fr(n)} XOF`;

/** 0.023 donne "2,3 %". Un taux non nul mais infime ne s'affiche pas "0 %". */
export function pourcent(fraction: number): string {
  if (fraction > 0 && fraction < 0.001) return "< 0,1 %";
  return `${fr(fraction * 100, 1)} %`;
}

/** Delai en heures. Au dela de 48 h, on passe en jours, plus parlant. */
export function duree(heures: number): string {
  if (heures >= 48) return `${fr(heures / 24, 1)} j`;
  return `${fr(heures, 1)} h`;
}

/** "2026-10-14" donne "14/10". */
export const jourCourt = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** "2026-10-14" donne "14 octobre 2026". */
export function jourLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
