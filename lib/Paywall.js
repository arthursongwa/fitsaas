"use client";
import Link from "next/link";
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
    <main className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-3 text-center">
        <h1 className="text-xl font-bold">Passe à FitSaaS Pro</h1>
        <p className="text-sm text-gray-600">Journal de séances, surcharge progressive et tableau de bord. 7 jours d'essai gratuit.</p>
        <button className="w-full bg-black text-white rounded p-2" onClick={go}>Démarrer l'essai gratuit</button>
        <Link className="text-sm underline" href="/">← Retour au suivi du poids</Link>
      </div>
    </main>
  );
}