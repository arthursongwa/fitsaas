"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Legend } from "recharts";
import Shell from "../../../lib/Shell";
import { supabase } from "../../../lib/supabase";
import { useProfile } from "../../../lib/useProfile";
import { Stat, btn2 } from "../../../lib/ui";
import { isoDay, shiftIso, fmtW, toUnit, movingAverage, trend, classifyTrend, sumEntries } from "../../../lib/calc";

export default function Page() {
  return <Shell title="Progrès" subtitle="Comprendre ce qui fonctionne" action={<Link href="/progress/weight" className={btn2}>Ajouter une pesée</Link>}><Content /></Shell>;
}

const RANGES = [["7", "7 j"], ["30", "30 j"], ["90", "90 j"], ["all", "Tout"]];
const TONE = { on_track: "border-success/40 bg-success/5 text-success", too_fast: "border-streak/40 bg-streak/10 text-streak", off_track: "border-streak/40 bg-streak/10 text-streak", stagnation: "border-info/40 bg-info/10 text-info", uncertain: "border-border bg-muted text-muted-foreground", insufficient: "border-border bg-muted text-muted-foreground" };

function Content() {
  const { profile } = useProfile();
  const [d, setD] = useState(null);
  const [range, setRange] = useState("30");
  useEffect(() => {
    (async () => {
      const today = isoDay(), from = shiftIso(today, -30);
      const [w, k, f] = await Promise.all([
        supabase.from("weights").select("*").order("date"),
        supabase.from("workouts").select("date").gte("date", from),
        supabase.from("food_entries").select("*").gte("date", shiftIso(today, -6)),
      ]);
      setD({ w: w.data ?? [], k: k.data ?? [], f: f.data ?? [] });
    })();
  }, []);
  if (!d) return null;
  const unit = profile.unit || "kg";
  const goal = Number(profile.goal_weight) || null;
  const today = isoDay();
  if (d.w.length === 0) return <div className="panel p-6 text-sm text-muted-foreground">Aucune pesée pour l'instant. <Link className="text-success underline" href="/progress/weight">Enregistre la première</Link> pour voir ta progression.</div>;

  const from = range === "all" ? "" : shiftIso(today, -Number(range));
  const series = movingAverage(d.w, 7).filter((x) => x.date >= from).map((x) => ({ date: x.date, "Pesée": +toUnit(x.weight, unit).toFixed(1), "Moyenne 7 j": +toUnit(x.avg, unit).toFixed(1) }));
  const t = trend(d.w);
  const cls = classifyTrend(t, profile.objective);
  const first = d.w[0], last = d.w[d.w.length - 1];
  const change = last.weight - first.weight;
  const sessions = new Set(d.k.map((r) => r.date)).size;
  const byDay = {}; d.f.forEach((e) => { (byDay[e.date] ||= []).push(e); });
  const foodDays = Object.keys(byDay);
  const avgKcal = foodDays.length ? Math.round(foodDays.reduce((a, k) => a + sumEntries(byDay[k]).kcal, 0) / foodDays.length) : null;
  const weighIns30 = d.w.filter((x) => x.date >= shiftIso(today, -30)).length;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Dernier poids" value={fmtW(last.weight, unit)} note={`Pesée du ${last.date}`} />
        <Stat label="Objectif" value={goal ? fmtW(goal, unit) : "–"} note={goal ? `${Math.abs(last.weight - goal).toFixed(1)} kg d'écart` : ""} good />
        <Stat label="Depuis le début" value={`${change > 0 ? "+" : ""}${toUnit(change, unit).toFixed(1)} ${unit}`} note={`depuis le ${first.date}`} good={profile.objective === "muscle" ? change >= 0 : change <= 0} />
        <Stat label="Rythme" value={t ? `${t.kgPerWeek > 0 ? "+" : ""}${toUnit(t.kgPerWeek, unit).toFixed(2)} ${unit}/sem.` : "–"} note={t ? `sur ${t.n} pesées` : "Pas assez de données"} />
      </div>

      <div className={`rounded-xl border p-4 text-sm ${TONE[cls.status]}`}>
        <p className="font-medium">Analyse</p><p className="mt-1">{cls.text}</p>
        <p className="mt-2 text-xs opacity-80">Une pesée isolée ne change pas ton objectif : seule la tendance sur plusieurs semaines compte.</p>
      </div>

      <section className="panel p-5">
        <div className="mb-3 flex gap-2">{RANGES.map(([k, l]) => <button key={k} onClick={() => setRange(k)} className={`rounded-lg border px-3 py-1 text-xs ${range === k ? "border-success bg-success/10 text-success" : "border-border hover:bg-accent"}`}>{l}</button>)}</div>
        {series.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Aucune pesée sur cette période.</p> : (
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={series}>
            <CartesianGrid stroke="#232b3d" vertical={false} /><XAxis dataKey="date" stroke="#8b95a9" fontSize={11} /><YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#8b95a9" fontSize={11} /><Tooltip contentStyle={{ background: "#111622", border: "1px solid #232b3d", borderRadius: 8 }} /><Legend />
            {goal && <ReferenceLine y={+toUnit(goal, unit).toFixed(1)} stroke="#fb923c" strokeDasharray="4 4" />}
            <Line dataKey="Pesée" stroke="#8b95a9" strokeWidth={1.5} dot={{ r: 2 }} />
            <Line dataKey="Moyenne 7 j" stroke="#34d399" strokeWidth={2.5} dot={false} />
          </LineChart></ResponsiveContainer></div>)}
        <p className="mt-2 text-xs text-muted-foreground">Gris : tes pesées réelles. Vert : moyenne glissante sur 7 jours, plus fiable que les valeurs du jour.</p>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Séances (30 jours)" value={sessions} />
        <Stat label="Pesées (30 jours)" value={weighIns30} note="régularité du suivi" />
        {avgKcal !== null && <Stat label="Calories moyennes" value={`${avgKcal} kcal`} note={`sur ${foodDays.length} jour(s) renseigné(s) / 7`} />}
      </div>
    </>
  );
}
