"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";
import { btn, Err, Ok } from "./ui";

export default function AuthForm({ mode }) {
  const reg = mode === "register";
  const router = useRouter();
  const session = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [msg, setMsg] = useState({ err: "", ok: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (session) router.replace("/"); }, [session, router]);

  async function submit(e) {
    e.preventDefault();
    setMsg({ err: "", ok: "" });
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg({ err: "Entre une adresse email valide.", ok: "" });
    if (password.length < 8) return setMsg({ err: "Le mot de passe doit contenir au moins 8 caractères.", ok: "" });
    if (reg && !accept) return setMsg({ err: "Accepte les conditions pour créer ton compte.", ok: "" });
    setBusy(true);
    const { data, error } = reg
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg({ err: reg ? `Inscription impossible : ${error.message}` : "Email ou mot de passe incorrect.", ok: "" });
    if (reg && !data.session) setMsg({ err: "", ok: "Compte créé. Confirme ton adresse via l'email reçu, puis connecte-toi." });
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="panel w-full max-w-sm space-y-3 p-8">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-success"><Zap className="h-5 w-5 text-primary-foreground" /></div>
          <span className="text-xl font-semibold tracking-tight">FitSaaS</span>
        </div>
        <p className="pb-2 text-sm text-muted-foreground">{reg ? "Crée ton compte pour suivre ton poids, ta nutrition et tes séances." : "Content de te revoir."}</p>
        <input className="w-full" type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full" type="password" autoComplete={reg ? "new-password" : "current-password"} placeholder="Mot de passe (8 caractères minimum)" value={password} onChange={(e) => setPassword(e.target.value)} />
        {reg && (
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" className="mt-0.5" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
            <span>J'accepte les <Link className="underline" href="/legal">conditions d'utilisation et la politique de confidentialité</Link>.</span>
          </label>
        )}
        <button className={`${btn} w-full`} disabled={busy}>{reg ? "Créer mon compte" : "Se connecter"}</button>
        <Err>{msg.err}</Err><Ok>{msg.ok}</Ok>
        <div className="flex justify-between pt-1 text-sm text-muted-foreground">
          {reg ? <Link className="underline" href="/login">J'ai déjà un compte</Link> : <Link className="underline" href="/register">Créer un compte</Link>}
          {!reg && <Link className="underline" href="/forgot-password">Mot de passe oublié</Link>}
        </div>
      </form>
    </main>
  );
}
