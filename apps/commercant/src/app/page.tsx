// Page d'accueil : redirige automatiquement vers le dashboard
// Plus tard, cette page deviendra la landing page publique de seni-corp.ci

import { redirect } from "next/navigation";
export default function Home() { redirect("/login"); }