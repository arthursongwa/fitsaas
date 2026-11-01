"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Flame, Trophy, Lock, Dumbbell, Footprints, Crown, Target, TrendingUp, TrendingDown, Utensils, Play } from "lucide-react";
import Shell from "../../lib/Shell";
import { Bar, btn } from "../../lib/ui";
import { supabase } from "../../lib/supabase";
import { useProfile } from "../../lib/useProfile";
import { compute } from "../../lib/stats";
import { isoDay, sumEntries, profileTargets, fmtW } from "../../lib/calc";

const ICONS = { Footprints, Crown, Dumbbell, Trophy, TrendingDown, Target };
const tone = { success: "text-success bg-success/10 border-success/40 shadow-glow-success", streak: "text-streak bg-streak/10 border-streak/40 shadow-glow-streak", info: "text-info bg-info/10 border-info/40 shadow-glow-info" };

export default function Page() {
  return <Shell title="Bon retour 👋" subtitle="Ton résumé du jour" action={<Link href="/workouts" className={btn}><Plus className="h-4 w-4" /> Nouvelle séance</Link>}><Content /></Shell>;
}

function Content() {
  const { profile } = useProfile();
  const [d, setD] = useState(null);
  useEffect(() => {
    (async () => {
      const [w, p, f, pr] = await Promise.all([
        supabase.from("workouts").select("*").order("date").order("id"),
        supabase.from("weights").select("*").order("date"),
        supabase.from("food_entries").select("*").eq("date", isoDay()),
        supabase.from("programs").select("*").eq("active", true).limit(1),
      ]);
      setD({ w: w.data ?? [], p: p.data ?? [], f: f.data ?? [], prog: pr.data?.[0] ?? null });
    })();
  }, []);
  if (!d) return null;

  const s = compute(d.w, d.p, profile);
  const unit = profile.unit || "kg";
  const t = profileTargets(profile);
  const tot = sumEntries(d.f);
  const days = d.prog?.days ?? [];
  const li = days.findIndex((x) => x.name === [...d.w].reverse().find((r) => r.day_name)?.day_name);
  const nextIdx = days.length ? (li + 1) % days.length : -1;
  const pct = Math.round((s.xpInto / s.xpNext) * 100);
  const qPct = Math.min(100, Math.round((s.weekDone / s.weekGoal) * 100));
  const max = Math.max(1, ...s.days.map((x) => x.xp));
  const wDelta = s.last != null ? s.last - s.first : 0;
  const wGood = profile.objective === "muscle" ? wDelta >= 0 : wDelta <= 0;
  const sign = (n) => (n >= 0 ? "+" : "") + n;
  const kpis = [
    { label: "XP sur 7 jours", value: s.week7, note: `${s.xp} XP au total`, up: true },
    { label: "Séances cette semaine", value: s.weekDone, note: `${sign(s.weekDone - s.lastDone)} vs sem. dernière`, up: s.weekDone >= s.lastDone },
    { label: "Volume de la semaine", value: `${Math.round(s.volWeek).toLocaleString("fr-FR")} kg`, note: s.volDelta === null ? "Première semaine" : `${sign(s.volDelta)} % vs sem. dernière`, up: (s.volDelta ?? 0) >= 0 },
    { label: "Poids actuel", value: fmtW(s.last, unit), note: s.last != null ? `${sign(+wDelta.toFixed(1))} kg depuis le début` : "Ajoute une pesée", up: wGood },
  ];

  return (
    <>
      <section className="panel space-y-4 p-6">
        <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"><Utensils className="h-4 w-4" /> Aujourd'hui</h3><Link href="/nutrition" className="text-sm text-success underline">Ouvrir le journal</Link></div>
        {t ? (<>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-3xl font-semibold tracking-tight">{Math.max(0, t.kcal - tot.kcal)} <span className="text-base font-normal text-muted-foreground">kcal restantes sur {t.kcal}</span></p>
            <p className="text-sm text-muted-foreground">P {tot.protein}/{t.protein} g · G {tot.carbs}/{t.carbs} g · L {tot.fat}/{t.fat} g</p>
          </div>
          <Bar value={(tot.kcal / t.kcal) * 100} tone={tot.kcal > t.kcal ? "streak" : "success"} />
        </>) : <p className="text-sm text-muted-foreground">Définis ton objectif calorique dans ton <Link className="text-success underline" href="/profile">profil</Link>.</p>}
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="panel p-5"><p className="text-xs font-medium text-muted-foreground">{k.label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{k.value}</p>
            <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${k.up ? "text-success" : "text-streak"}`}>{k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {k.note}</p></div>
        ))}
      </div>

      <section className="panel grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-success/40 bg-success/10 text-2xl font-bold text-success shadow-glow-success">{s.level}</div>
          <div className="w-full">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-semibold">Niveau {s.level} · {s.title}</h2><span className="font-mono text-sm text-muted-foreground">{s.xpInto} / {s.xpNext} XP</span></div>
            <div className="mt-3"><Bar value={pct} /></div>
            <p className="mt-2 text-xs text-muted-foreground">{s.xpNext - s.xpInto} XP avant le niveau {s.level + 1}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-streak/30 bg-streak/10 px-5 py-4 shadow-glow-streak">
          <Flame className="h-8 w-8 animate-flame text-streak" fill="currentColor" />
          <div><p className="text-2xl font-bold leading-none text-streak">{s.streak}</p><p className="text-xs font-medium text-muted-foreground">jours d'affilée</p></div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="panel space-y-4 p-6">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quête de la semaine</h3><Target className="h-4 w-4 text-streak" /></div>
          <p className="font-medium">Faire {s.weekGoal} séances cette semaine</p>
          <div className="flex gap-2">{Array.from({ length: s.weekGoal }).map((_, i) => <div key={i} className={`h-10 flex-1 rounded-lg border ${i < s.weekDone ? "border-success/50 bg-success/20" : "border-border bg-muted"}`} />)}</div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{s.weekDone}/{s.weekGoal} faites</span><span className="font-mono text-success">{qPct}%</span></div>
          {nextIdx >= 0 ? (
            <Link href={`/workouts/session?day=${nextIdx}`} className="flex items-center gap-3 rounded-xl border border-dashed border-success/40 bg-success/5 p-3 text-sm"><Play className="h-5 w-5 text-success" /><span><span className="block text-xs text-muted-foreground">Prochaine séance</span>{days[nextIdx].name}</span></Link>
          ) : <Link href="/workouts" className="block rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">Crée ou choisis un programme</Link>}
        </section>

        <section className="panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Succès</h3><span className="text-xs text-muted-foreground">{s.badges.filter((b) => b.unlocked).length}/{s.badges.length}</span></div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {s.badges.map((b) => { const Icon = ICONS[b.icon]; return (
              <div key={b.name} className={`relative rounded-xl border p-4 ${b.unlocked ? "border-border bg-card" : "border-border/60 bg-muted/40 opacity-60"}`}>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${b.unlocked ? tone[b.tone] : "border-border bg-muted text-muted-foreground"}`}><Icon className="h-5 w-5" /></div>
                {!b.unlocked && <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />}
                <p className="mt-3 text-sm font-semibold">{b.name}</p><p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>); })}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="panel p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">XP sur 7 jours</h3>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{s.week7} <span className="text-base font-normal text-muted-foreground">XP</span></p>
          <div className="mt-6 flex h-44 items-end gap-3">
            {s.days.map((w, i) => (<div key={i} className="flex flex-1 flex-col items-center gap-2"><div className="flex h-36 w-full items-end"><div className={`w-full rounded-md ${w.xp ? "bg-gradient-success" : "bg-muted"}`} style={{ height: `${w.xp ? (w.xp / max) * 100 : 4}%` }} /></div><span className="text-xs text-muted-foreground">{w.d}</span></div>))}
          </div>
        </section>
        <section className="panel p-6 lg:col-span-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Activité récente</h3>
          {s.feed.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Aucune séance pour l'instant. <Link className="text-success underline" href="/workouts">Lance la première</Link>.</p> : (
            <ul className="mt-4 divide-y divide-border">{s.feed.map((f) => (
              <li key={f.id} className="flex items-center gap-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted"><Dumbbell className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{f.name}</p><p className="truncate text-xs text-muted-foreground">{f.meta} · {f.when}</p></div>
                <span className="rounded-md border border-success/30 bg-success/10 px-2 py-1 font-mono text-xs font-semibold text-success">+{f.xp} XP</span>
              </li>))}</ul>)}
        </section>
      </div>
    </>
  );
}
