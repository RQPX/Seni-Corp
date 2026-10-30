// ============================================================
// Pastille de statut
// ============================================================

import { statutConfig } from "@/lib/statuts";

export function StatutBadge({ statut, taille = "normale" }: {
  statut: string;
  taille?: "normale" | "petite";
}) {
  const config = statutConfig(statut);
  const petite = taille === "petite";

  return (
    <span
      className="inline-flex items-center rounded-full whitespace-nowrap"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        fontFamily: "var(--font-body)",
        fontSize: petite ? "10px" : "11px",
        fontWeight: 600,
        letterSpacing: "0.3px",
        padding: petite ? "3px 8px" : "4px 10px",
      }}
    >
      {config.label}
    </span>
  );
}
