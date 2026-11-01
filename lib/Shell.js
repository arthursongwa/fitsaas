"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Dumbbell, Scale, Settings, Zap, LogOut } from "lucide-react";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";
import { useSub } from "./useSub";
import Paywall from "./Paywall";

export function Bar({ value, tone = "success" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full transition-all duration-1000 ${tone === "success" ? "bg-gradient-success" : "bg-gradient-streak"}`} style={{ width: `${value}%` }} />
    </div>
  );
}

const nav = [
  { href: "/", label: "Accueil", icon: LayoutDashboard },
  { href: "/workouts", label: "Séances", icon: Dumbbell },
  { href: "/weight", label: "Poids", icon: Scale },
  { href: "/settings", label: "Réglages", icon: Settings },
];

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  async function go(signup) {
    const { error } = signup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setMsg(error ? error.message : signup ? "Compte créé. Vérifie tes emails si une confirmation est demandée." : "");
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="panel w-full max-w-sm space-y-3 p-8">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-success"><Zap className="h-5 w-5 text-primary-foreground" /></div>
          <span className="text-xl font-semibold tracking-tight">FitSaaS</span>
        </div>
        <p className="pb-2 text-sm text-muted-foreground">Suis ton poids, tes séances et ta progression.</p>
        <input className="w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full" type="password" placeholder="Mot de passe (6+ caractères)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-success hover:brightness-110" onClick={() => go(false)}>Se connecter</button>
        <button className="w-full rounded-lg border border-border px-4 py-2.5 text-sm hover:bg-accent" onClick={() => go(true)}>Créer un compte</button>
        {msg && <p className="text-sm text-streak">{msg}</p>}
      </div>
    </main>
  );
}

function Frame({ title, subtitle, pro, action, children, email }) {
  const path = usePathname();
  const sub = useSub();
  const locked = pro && !sub.loading && !sub.active;
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar p-4 lg:flex">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-success"><Zap className="h-4 w-4 text-primary-foreground" /></div>
          <span className="text-lg font-semibold tracking-tight">FitSaaS</span>
          {sub.active && <span className="ml-auto rounded-md border border-streak/40 bg-streak/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-streak">Pro</span>}
        </div>
        <nav className="mt-8 space-y-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${path === n.href ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          {!sub.loading && !sub.active && (
            <Link href="/workouts" className="block rounded-xl border border-streak/30 bg-streak/10 p-3 text-xs font-medium text-streak">
              Passer Pro : 7 jours offerts
            </Link>
          )}
          <div className="truncate px-3 text-xs text-muted-foreground">{email}</div>
          <button onClick={() => supabase.auth.signOut()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-24 lg:pb-8">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm capitalize text-muted-foreground">{subtitle}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
            </div>
            {action}
          </div>
          {pro && sub.loading ? null : locked ? <Paywall /> : children}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-sidebar/95 backdrop-blur lg:hidden">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] ${path === n.href ? "text-success" : "text-muted-foreground"}`}>
            <n.icon className="h-5 w-5" /> {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function Shell(props) {
  const session = useAuth();
  if (session === undefined) return null;
  if (!session) return <Login />;
  return <Frame {...props} email={session.user.email} />;
}