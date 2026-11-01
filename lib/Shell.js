"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Utensils, Dumbbell, TrendingUp, User, Settings, Zap, LogOut } from "lucide-react";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";
import { useSub } from "./useSub";
import Paywall from "./Paywall";

const nav = [
  { href: "/", label: "Accueil", icon: LayoutDashboard }, { href: "/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/workouts", label: "Séances", icon: Dumbbell }, { href: "/progress", label: "Progrès", icon: TrendingUp },
  { href: "/profile", label: "Profil", icon: User },
];
const on = (path, href) => (href === "/" ? path === "/" : path.startsWith(href));

function Frame({ title, subtitle, pro, action, children, email, bare }) {
  const path = usePathname();
  const sub = useSub();
  const body = pro && sub.loading ? null : pro && !sub.active ? <Paywall /> : children;
  const head = (<div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">{subtitle}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1></div>{action}</div>);
  const logo = (<div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-success"><Zap className="h-4 w-4 text-primary-foreground" /></div><span className="text-lg font-semibold">FitSaaS</span></div>);
  if (bare) {
    return (<main className="mx-auto max-w-xl space-y-6 px-4 py-10"><div className="flex items-center justify-between">{logo}<button className="text-sm text-muted-foreground underline" onClick={() => supabase.auth.signOut()}>Déconnexion</button></div>{head}{body}</main>);
  }
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar p-4 lg:flex">
        <div className="flex items-center gap-2 px-2 py-2">{logo}{sub.active && <span className="ml-auto rounded-md border border-streak/40 bg-streak/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-streak">Pro</span>}</div>
        <nav className="mt-8 space-y-1">
          {[...nav, { href: "/settings", label: "Réglages", icon: Settings }].map((n) => (
            <Link key={n.href} href={n.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${on(path, n.href) ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"}`}><n.icon className="h-4 w-4" /> {n.label}</Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          {!sub.loading && !sub.active && <Link href="/settings/billing" className="block rounded-xl border border-streak/30 bg-streak/10 p-3 text-xs font-medium text-streak">Passer Pro : 7 jours offerts</Link>}
          <div className="truncate px-3 text-xs text-muted-foreground">{email}</div>
          <button onClick={() => supabase.auth.signOut()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"><LogOut className="h-4 w-4" /> Déconnexion</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 pb-24 lg:pb-8"><div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8"><Link href="/settings" aria-label="Réglages" className="float-right text-muted-foreground lg:hidden"><Settings className="h-5 w-5" /></Link>{head}{body}</div></main>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-sidebar/95 backdrop-blur lg:hidden">
        {nav.map((n) => (<Link key={n.href} href={n.href} className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] ${on(path, n.href) ? "text-success" : "text-muted-foreground"}`}><n.icon className="h-5 w-5" /> {n.label}</Link>))}
      </nav>
    </div>
  );
}

// Garde : connexion obligatoire, puis onboarding obligatoire.
export default function Shell(props) {
  const session = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [prof, setProf] = useState(undefined);
  useEffect(() => { if (session === null) router.replace("/login"); }, [session, router]);
  useEffect(() => { if (!session) return; supabase.from("profiles").select("onboarded").maybeSingle().then(({ data }) => setProf(data || {})); }, [session?.user.id]);
  useEffect(() => { if (prof && !prof.onboarded && path !== "/onboarding") router.replace("/onboarding"); }, [prof, path, router]);
  if (!session || prof === undefined) return null;
  if (!prof.onboarded && path !== "/onboarding") return null;
  return <Frame {...props} email={session.user.email} />;
}
