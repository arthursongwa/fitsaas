"use client";
import { useState } from "react";
import { Lock, Check } from "lucide-react";
import { api } from "./api";
import { btn, Err } from "./ui";

export default function Paywall() {
  const [err, setErr] = useState("");
  async function go() {
    setErr("");
    const j = await api("/api/checkout");
    if (j.url) window.location = j.url; else setErr(j.error || "Impossible de lancer le paiement.");
  }
  return (
    <section className="panel mx-auto max-w-md space-y-4 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-streak/40 bg-streak/10 shadow-glow-streak"><Lock className="h-6 w-6 text-streak" /></div>
      <h2 className="text-xl font-semibold">Passe à FitSaaS Pro</h2>
      <ul className="space-y-2 text-left text-sm text-muted-foreground">
        {["Journal alimentaire avec calories et macros", "Programmes et séances avec surcharge progressive", "Records, historique et comparaison"].map((t) => (
          <li key={t} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-success" />{t}</li>
        ))}
      </ul>
      <button className={`${btn} w-full`} onClick={go}>Démarrer l'essai gratuit de 7 jours</button>
      <Err>{err}</Err>
    </section>
  );
}
