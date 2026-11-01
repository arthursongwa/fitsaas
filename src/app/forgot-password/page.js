"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { btn, Err, Ok } from "../../../lib/ui";

export default function Page() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState({ err: "", ok: "" });
  async function submit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg({ err: "Entre une adresse email valide.", ok: "" });
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setMsg({ err: "", ok: "Si un compte existe avec cette adresse, un email de réinitialisation vient d'être envoyé." });
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="panel w-full max-w-sm space-y-3 p-8">
        <h1 className="text-xl font-semibold">Mot de passe oublié</h1>
        <p className="text-sm text-muted-foreground">Entre ton email, on t'envoie un lien pour choisir un nouveau mot de passe.</p>
        <input className="w-full" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className={`${btn} w-full`}>Envoyer le lien</button>
        <Err>{msg.err}</Err><Ok>{msg.ok}</Ok>
        <Link className="block text-sm text-muted-foreground underline" href="/login">Retour à la connexion</Link>
      </form>
    </main>
  );
}
