"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Trash2, Pencil, Trophy } from "lucide-react";
import Shell from "../../../../lib/Shell";
import { supabase } from "../../../../lib/supabase";
import { Err, btn2 } from "../../../../lib/ui";
import { isoDay, shiftIso, best1rm, fmtSets, parseSets } from "../../../../lib/calc";
export default function Page() { return <Shell title="Historique" subtitle="Toutes tes séances" pro action={<Link href="/workouts" className={btn2}>← Séances</Link>}><Content /></Shell>; }
function Content() {
  const [rows, setRows] = useState(null); const [period, setPeriod] = useState("30"); const [ex, setEx] = useState(""); const [err, setErr] = useState("");
  async function load() { const { data, error } = await supabase.from("workouts").select("*").order("date").order("id"); if (error) setErr(error.message); setRows(data ?? []); }
  useEffect(() => { load(); }, []);
  if (!rows) return null;
  const prs = new Set(), best = {};
  rows.forEach((r) => { const k = r.exercise.toLowerCase(), b = best1rm(r.sets); if (best[k] !== undefined && b > best[k]) prs.add(r.id); best[k] = Math.max(best[k] ?? 0, b); });
  const from = period === "all" ? "" : shiftIso(isoDay(), -Number(period));
  const shown = rows.filter((r) => r.date >= from && (!ex || r.exercise === ex));
  const names = [...new Set(rows.map((r) => r.exercise))].sort();
  const chart = ex ? shown.map((r) => ({ date: r.date, rm: +best1rm(r.sets).toFixed(1) })) : [];
  const dates = [...new Set(shown.map((r) => r.date))].reverse();
  async function remove(id) { if (!confirm("Supprimer cet exercice de l'historique ?")) return; const { error } = await supabase.from("workouts").delete().eq("id", id); if (error) setErr(error.message); else load(); }
  async function edit(r) {
    const t = prompt(`Modifier les séries de « ${r.exercise} » (ex. 70x8 9 9)`, r.sets.map((s) => `${s.kg}x${s.reps}`).join(" "));
    if (t === null) return;
    const sets = parseSets(t);
    if (!sets.length) return setErr("Séries invalides : rien n'a été modifié.");
    const { error } = await supabase.from("workouts").update({ sets }).eq("id", r.id);
    if (error) setErr(error.message); else { setErr(""); load(); }
  }
  return (<>
    <div className="flex flex-wrap gap-2">
      <select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="30">30 derniers jours</option><option value="90">90 derniers jours</option><option value="all">Tout l'historique</option></select>
      <select value={ex} onChange={(e) => setEx(e.target.value)}><option value="">Tous les exercices</option>{names.map((n) => <option key={n}>{n}</option>)}</select>
    </div>
    <Err>{err}</Err>
    {chart.length > 1 && (<div className="panel h-64 p-4"><p className="mb-1 text-sm text-muted-foreground">1RM estimé (kg) : {chart[0].rm} → {chart[chart.length - 1].rm}</p>
      <ResponsiveContainer width="100%" height="88%"><LineChart data={chart}><CartesianGrid stroke="#232b3d" vertical={false} /><XAxis dataKey="date" stroke="#8b95a9" fontSize={11} /><YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#8b95a9" fontSize={11} /><Tooltip contentStyle={{ background: "#111622", border: "1px solid #232b3d", borderRadius: 8 }} /><Line type="monotone" dataKey="rm" stroke="#34d399" strokeWidth={2.5} /></LineChart></ResponsiveContainer></div>)}
    {dates.length === 0 && <div className="panel p-6 text-sm text-muted-foreground">Aucune séance sur cette période.</div>}
    {dates.map((d) => { const day = shown.filter((r) => r.date === d); return (
      <section key={d} className="panel p-5"><h3 className="mb-2 text-sm font-semibold text-muted-foreground">{d}{day.find((r) => r.day_name) ? ` · ${day.find((r) => r.day_name).day_name}` : ""}</h3>
        <ul className="divide-y divide-border">{day.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0"><p className="flex items-center gap-2 font-medium">{r.exercise}{prs.has(r.id) && <Trophy className="h-4 w-4 text-streak" />}</p><p className="truncate text-muted-foreground">{fmtSets(r.sets)}{r.rpe ? ` · RPE ${r.rpe}` : ""}</p></div>
            <div className="flex gap-3 text-muted-foreground"><button aria-label="Modifier" className="hover:text-foreground" onClick={() => edit(r)}><Pencil className="h-4 w-4" /></button><button aria-label="Supprimer" className="hover:text-streak" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></button></div>
          </li>))}</ul></section>); })}
  </>);
}
