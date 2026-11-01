"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/useAuth";
import { btn, Err, Ok } from "../../../lib/ui";
export default function Page() {
  const session = useAuth();
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState({ err: "", ok: "" });
  if (session === undefined) return null;
  if (!session) return <main className="mx-auto max-w-md p-8 text-center">Ce lien est invalide ou a expiré. <Link className="underline" href="/forgot-password">Demander un nouveau lien</Link></main>;
  async function submit(e) {
    e.preventDefault();
    if (pw.length < 8) return setMsg({ err: "Au moins 8 caractères.", ok: "" });
    if (pw !== pw2) return setMsg({ err: "Les deux mots de passe ne correspondent pas.", ok: "" });
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setMsg({ err: error.message, ok: "" });
    setMsg({ err: "", ok: "Mot de passe modifié. Redirection…" }); setTimeout(() => { window.location.href = "/"; }, 1200);
  }
  return (<main className="flex min-h-screen items-center justify-center p-4"><form onSubmit={submit} className="panel w-full max-w-sm space-y-3 p-8">
    <h1 className="text-xl font-semibold">Nouveau mot de passe</h1>
    <input className="w-full" type="password" autoComplete="new-password" placeholder="Nouveau mot de passe" value={pw} onChange={(e) => setPw(e.target.value)} />
    <input className="w-full" type="password" autoComplete="new-password" placeholder="Confirme le mot de passe" value={pw2} onChange={(e) => setPw2(e.target.value)} />
    <button className={`${btn} w-full`}>Enregistrer</button><Err>{msg.err}</Err><Ok>{msg.ok}</Ok></form></main>);
}
