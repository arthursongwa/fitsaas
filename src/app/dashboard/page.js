"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../../../lib/supabase";
import { useSub } from "../../../lib/useSub";
import Paywall from "../../../lib/Paywall";

const e1rm = (s) => s.kg * (1 + s.reps / 30);

// Lundi de la semaine d'une date (format AAAA-MM-JJ)
function monday(d) {
  const x = new Date(d + "T00:00:00");
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [logged, setLogged] = useState(null);
  const sub = useSub();
  const [workouts, setWorkouts] = useState([]);
  const [weights, setWeights] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setLogged(!!data.session);
      if (!data.session) return;
      const w = await supabase.from("workouts").select("*").order("date");
      const p = await supabase.from("weights").select("*").order("date");
      setWorkouts(w.data ?? []);
      setWeights(p.data ?? []);
    });
  }, []);

  if (logged === null) return null;
  if (!logged) return <main className="p-4">Connecte-toi d'abord. <Link className="underline" href="/">Accueil</Link></main>;
  if (sub.loading) return null;
  if (!sub.active) return <Paywall />;

  // Chiffres clés
  const sessionDates = [...new Set(workouts.map((r) => r.date))];
  const allSets = workouts.flatMap((r) => r.sets);
  const volume = allSets.reduce((a, s) => a + s.kg * s.reps, 0);

  // Séances par semaine (8 dernières semaines avec activité)
  const perWeek = {};
  sessionDates.forEach((d) => { const m = monday(d); perWeek[m] = (perWeek[m] || 0) + 1; });
  const weekData = Object.keys(perWeek).sort().slice(-8).map((k) => ({ semaine: k.slice(5), seances: perWeek[k] }));

  // Records : meilleur 1RM estimé par exercice
  const records = {};
  workouts.forEach((r) => {
    const best = Math.max(...r.sets.map(e1rm));
    const maxKg = Math.max(...r.sets.map((s) => s.kg));
    const cur = records[r.exercise] || { rm: 0, kg: 0 };
    records[r.exercise] = { rm: Math.max(cur.rm, best), kg: Math.max(cur.kg, maxKg) };
  });
  const recordList = Object.entries(records).sort((a, b) => b[1].rm - a[1].rm);

  // Tendance du poids : moyenne 7 derniers jours vs 7 jours d'avant
  const avg = (arr) => (arr.length ? arr.reduce((a, r) => a + r.weight, 0) / arr.length : null);
  const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  const last7 = avg(weights.filter((r) => r.date > daysAgo(7)));
  const prev7 = avg(weights.filter((r) => r.date <= daysAgo(7) && r.date > daysAgo(14)));
  const trend = last7 !== null && prev7 !== null ? last7 - prev7 : null;

  const stat = (label, v) => (
    <div className="bg-white rounded-xl shadow p-4 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{v}</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <div className="flex gap-4 text-sm">
          <Link className="underline" href="/">Poids</Link>
          <Link className="underline" href="/workouts">Séances</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stat("Séances", sessionDates.length)}
        {stat("Séries", allSets.length)}
        {stat("Volume (t)", (volume / 1000).toFixed(1))}
        {stat("Poids 7j (kg)", trend === null ? "–" : `${trend > 0 ? "+" : ""}${trend.toFixed(1)}`)}
      </div>

      <div className="bg-white rounded-xl shadow p-4 h-56">
        <div className="text-sm text-gray-500 mb-1">Séances par semaine</div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={weekData}>
            <XAxis dataKey="semaine" fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="seances" fill="#111" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow divide-y">
        <div className="p-3 text-sm text-gray-500">Records par exercice</div>
        {recordList.length === 0 && <div className="p-3 text-sm">Aucune séance pour l'instant.</div>}
        {recordList.map(([name, r]) => (
          <div key={name} className="p-3 flex justify-between text-sm">
            <span className="font-semibold">{name}</span>
            <span className="text-gray-600">{r.kg} kg max · 1RM ≈ {r.rm.toFixed(1)} kg</span>
          </div>
        ))}
      </div>
    </main>
  );
}