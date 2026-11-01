"use client";
import { useState } from "react";
import Shell from "../../../../lib/Shell";
import { useSub } from "../../../../lib/useSub";
import { api } from "../../../../lib/api";
import { Err, btn, btn2 } from "../../../../lib/ui";
export default function Page() { return <Shell title="Abonnement" subtitle="FitSaaS Pro"><Content /></Shell>; }
const LABEL = { active: "Actif", trialing: "Essai gratuit en cours", past_due: "Paiement en retard", canceled: "Résilié", unpaid: "Impayé", incomplete: "Paiement incomplet", incomplete_expired: "Expiré", paused: "En pause" };
function Content() {
  const sub = useSub(); const [err, setErr] = useState("");
  if (sub.loading) return null;
  async function go(path) { setErr(""); const j = await api(path); if (j.url) window.location = j.url; else setErr(j.error || "Une erreur est survenue."); }
  const date = sub.periodEnd ? new Date(sub.periodEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null;
  return (
    <section className="panel max-w-xl space-y-4 p-6">
      <div className="flex items-center justify-between"><h2 className="font-semibold">FitSaaS Pro · mensuel</h2><span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${sub.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{sub.status ? LABEL[sub.status] || sub.status : "Aucun abonnement"}</span></div>
      {date && <p className="text-sm text-muted-foreground">{sub.cancel ? `Résilié : l'accès reste actif jusqu'au ${date}.` : sub.status === "trialing" ? `L'essai se termine, puis le premier paiement a lieu le ${date}.` : `Prochain renouvellement le ${date}.`}</p>}
      {sub.status === "past_due" && <p className="text-sm text-streak">Ton dernier paiement a échoué. Mets à jour ta carte depuis le portail.</p>}
      <div className="flex flex-wrap gap-3">
        {sub.status ? <button className={btn} onClick={() => go("/api/portal")}>Gérer mon abonnement et mes factures</button> : <button className={btn} onClick={() => go("/api/checkout")}>Démarrer l'essai gratuit de 7 jours</button>}
        {sub.status && !sub.active && <button className={btn2} onClick={() => go("/api/checkout")}>Se réabonner</button>}
      </div>
      <p className="text-xs text-muted-foreground">Le portail Stripe permet de changer de carte, télécharger les factures et résilier. Le statut est vérifié côté serveur à chaque écriture.</p>
      <Err>{err}</Err>
    </section>);
}
