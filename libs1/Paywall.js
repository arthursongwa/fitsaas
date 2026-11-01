"use client";
import { Lock, Check } from "lucide-react";
import { supabase } from "./supabase";

export default function Paywall() {
  async function go() {
    const { data } = await supabase.auth.getSession();
    const r = await fetch("/api/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    const j = await r.json();
    if (j.url) window.location = j.url;
    else alert(j.error);
  }
  return (
    <section className="panel mx-auto max-w-md space-y-4 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-streak/40 bg-streak/10 shadow-glow-streak">
        <Lock className="h-6 w-6 text-streak" />
      </div>
      <h2 className="text-xl font-semibold">Passe à FitSaaS Pro</h2>
      <ul className="space-y-2 text-left text-sm text-muted-foreground">
        {["Journal de séances illimité", "Surcharge progressive automatique", "Records et 1RM estimé"].map((t) => (
          <li key={t} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-success" />{t}</li>
        ))}
      </ul>
      <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-success transition hover:brightness-110" onClick={go}>
        Démarrer l'essai gratuit de 7 jours
      </button>
    </section>
  );
}