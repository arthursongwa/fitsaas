"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChart, Line, BarChart, Bar as RBar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Shell from "../../../../lib/Shell";
import { supabase } from "../../../../lib/supabase";
import { useProfile } from "../../../../lib/useProfile";
import { useExercises } from "../../../../lib/useExercises";
import { Stat, Empty, btn2 } from "../../../../lib/ui";
import { analyze, mondayIso } from "../../../../lib/analytics";
import { fmtSets, isoDay } from "../../../../lib/calc";

export default function Page() {
  return <Shell title="Bilan d'entraînement" subtitle="Progression, records et graphiques" pro action={<Link href="/workouts" className={btn2}>← Séances</Link>}><Content /></Shell>;
}

const TABS = [["bilan", "Bilan"], ["graph", "Graphiques"], ["hebdo", "Suivi hebdo"], ["guide", "Guide"]];
const V = { up: "text-success", keep: "text-streak", down: "text-red-400" };
const ST = { record: ["★ Record", "bg-success/15 text-success"], stagnation: ["⚠ Stagnation", "bg-red-500/15 text-red-400"], ok: ["OK", "bg-muted text-muted-foreground"] };
const tip = { background: "#111622", border: "1px solid #232b3d", borderRadius: 8 };
const pct = (x) => (x == null ? "–" : `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)} %`);

function Content() {
  const { profile, loading } = useProfile();
  const { cfgOf, loading: l2 } = useExercises();
  const [d, setD] = useState(null);
  const [tab, setTab] = useState("bilan");
  const [sel, setSel] = useState("");
  useEffect(() => {
    (async () => {
      const [w, p] = await Promise.all([supabase.from("workouts").select("*").order("date").order("id"), supabase.from("weights").select("weight,date").order("date", { ascending: false }).limit(1)]);
      setD({ rows: w.data ?? [], bw: p.data?.[0]?.weight ?? null });
    })();
  }, []);
  if (!d || loading || l2) return null;
  if (d.rows.length === 0) return <Empty>Aucune séance enregistrée. <Link className="text-success underline" href="/workouts">Lance une séance</Link> ou <Link className="text-success underline" href="/workouts/import">importe ton Excel</Link>.</Empty>;

  const start = profile.program_start || mondayIso(d.rows[0].date);
  const A = analyze(d.rows, cfgOf, start, isoDay());
  const k = A.kpi, goal = profile.training_days || profile.weekly_goal || 3;
  const ex = A.exercises.find((e) => e.name === sel) || A.exercises[0];

  return (
    <>
      <div className="flex gap-2 overflow-x-auto">{TABS.map(([id, l]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm ${tab === id ? "border-success bg-success/10 text-success" : "border-border hover:bg-accent"}`}>{l}</button>)}</div>

      {tab === "bilan" && (<>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Séances" value={k.sessions} note="au total" />
          <Stat label="Séries" value={k.sets} note="effectuées" />
          <Stat label="Volume total" value={`${(k.volume / 1000).toFixed(1)} t`} note="charge × reps" />
          <Stat label="Semaines suivies" value={k.weeks} note="du programme" />
          <Stat label="Records battus ★" value={k.prs} note="1RM estimé" />
          <Stat label="En stagnation ⚠" value={k.stagnating} note="sans record 3 sem.+" good={k.stagnating === 0} />
          <Stat label="Reps totales" value={k.reps} />
          <Stat label="Séances cette semaine" value={`${k.thisWeek} / ${goal}`} note={k.thisWeek >= goal ? "objectif atteint" : "objectif de la semaine"} good={k.thisWeek >= goal} />
          <Stat label="Volume semaine en cours" value={`${Math.round(k.volWeek).toLocaleString("fr-FR")} kg`} note={k.volDelta == null ? "première semaine" : `${k.volDelta >= 0 ? "+" : ""}${k.volDelta} % vs préc.`} good={(k.volDelta ?? 0) >= 0} />
          <Stat label="Poids de corps" value={d.bw ? `${d.bw} kg` : "–"} note="dernière pesée" />
          <Stat label="Meilleure progression" value={k.best ? pct(k.best.evo) : "–"} note={k.best?.name} />
        </div>
        <h2 className="pt-2 text-lg font-semibold">Prochaine séance & bilans</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {A.exercises.map((e) => (
            <section key={e.name} className="panel space-y-2 p-5">
              <div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{e.name}</h3><p className="text-xs text-muted-foreground">{e.group} · {e.sessions} séance(s)</p></div><span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${ST[e.status][1]}`}>{ST[e.status][0]}</span></div>
              <p className="text-sm text-muted-foreground">Dernière ({e.last.date}) : {fmtSets(e.last.sets)}</p>
              <div className="rounded-xl bg-muted p-3 text-sm"><p className={`font-medium ${V[e.target.verdict]}`}>{e.target.label}</p><p>Prochaine : <b>{e.target.text}</b></p></div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs"><div><div className="text-muted-foreground">1RM début → actuel</div><b>{e.rmStart ? e.rmStart.toFixed(1) : "–"} → {e.rmNow ? e.rmNow.toFixed(1) : "–"}</b></div><div><div className="text-muted-foreground">Record 1RM</div><b>{e.record ? e.record.toFixed(1) : "–"} kg</b></div><div><div className="text-muted-foreground">Évolution</div><b className={e.evo > 0 ? "text-success" : ""}>{pct(e.evo)}</b></div></div>
              {d.bw && e.record > 0 && <p className="text-xs text-muted-foreground">Ratio 1RM / poids de corps : <b>{(e.record / d.bw).toFixed(2)}×</b> · charge max {e.maxLoad} kg</p>}
            </section>
          ))}
        </div>
      </>)}

      {tab === "graph" && ex && (<>
        <select className="w-full max-w-sm" value={ex.name} onChange={(e) => setSel(e.target.value)}>{A.exercises.map((e) => <option key={e.name}>{e.name}</option>)}</select>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <Stat label="Charge record" value={`${ex.maxLoad} kg`} /><Stat label="1RM record" value={ex.record ? `${ex.record.toFixed(1)} kg` : "–"} note="formule d'Epley" /><Stat label="Séances" value={ex.sessions} />
          <Stat label="Évolution 1RM" value={pct(ex.evo)} /><Stat label="Prochaine charge" value={`${ex.target.kg} kg`} /><Stat label="Objectif" value={`${ex.target.sets}×${ex.target.reps}`} />
        </div>
        <section className="panel h-72 p-4"><p className="mb-1 text-sm text-muted-foreground">1RM estimé et charge max par séance (kg)</p>
          <ResponsiveContainer width="100%" height="90%"><LineChart data={ex.rows.map((r) => ({ date: r.date, "1RM": +r.rm.toFixed(1), "Charge max": r.maxKg }))}><CartesianGrid stroke="#232b3d" vertical={false} /><XAxis dataKey="date" stroke="#8b95a9" fontSize={11} /><YAxis domain={["dataMin - 3", "dataMax + 3"]} stroke="#8b95a9" fontSize={11} /><Tooltip contentStyle={tip} /><Line dataKey="1RM" stroke="#34d399" strokeWidth={2.5} /><Line dataKey="Charge max" stroke="#fb923c" strokeWidth={2} /></LineChart></ResponsiveContainer></section>
        <section className="panel h-60 p-4"><p className="mb-1 text-sm text-muted-foreground">Volume par séance (kg)</p>
          <ResponsiveContainer width="100%" height="88%"><BarChart data={ex.rows.map((r) => ({ date: r.date, Volume: Math.round(r.vol) }))}><CartesianGrid stroke="#232b3d" vertical={false} /><XAxis dataKey="date" stroke="#8b95a9" fontSize={11} /><YAxis stroke="#8b95a9" fontSize={11} /><Tooltip contentStyle={tip} /><RBar dataKey="Volume" fill="#34d399" radius={4} /></BarChart></ResponsiveContainer></section>
      </>)}

      {tab === "hebdo" && (<>
        <p className="text-sm text-muted-foreground">Charge max par semaine (12 dernières semaines). <span className="text-success">Vert</span> = nouveau record de charge.</p>
        <div className="panel overflow-x-auto p-3"><table className="w-full min-w-[560px] text-center text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2 text-left">Exercice</th>{A.weeks.map((w) => <th key={w}>S{w}</th>)}</tr></thead><tbody className="divide-y divide-border">
          {A.exercises.map((e) => <tr key={e.name}><td className="whitespace-nowrap p-2 text-left">{e.name}</td>{e.grid.map((g) => <td key={g.w} className={g.rec ? "bg-success/20 font-semibold text-success" : "text-muted-foreground"}>{g.max ?? "·"}</td>)}</tr>)}
        </tbody></table></div>
        <div className="panel overflow-x-auto p-3"><table className="w-full min-w-[560px] text-center text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="p-2 text-left">Totaux</th>{A.weeks.map((w) => <th key={w}>S{w}</th>)}</tr></thead><tbody className="divide-y divide-border">
          {[["Volume (kg)", "vol"], ["Séries", "sets"], ["Séances", "sessions"]].map(([l, key]) => <tr key={key}><td className="p-2 text-left">{l}</td>{A.wk.map((x) => <td key={x.w}>{Math.round(x[key]) || "·"}</td>)}</tr>)}
        </tbody></table></div>
      </>)}

      {tab === "guide" && (
        <section className="panel max-w-2xl space-y-3 p-6 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-semibold text-foreground">La règle de double progression</h2>
          <p><b className="text-success">▲</b> Toutes les séries à ta charge la plus lourde sont au « reps max » (et le nombre de séries cible est fait) : augmente la charge de l'incrément et repars au « reps min ».</p>
          <p><b className="text-streak">●</b> Charge max tenue au-dessus du « reps min » mais pas encore au max : garde la charge et vise +1 rep.</p>
          <p><b className="text-red-400">▼</b> Une série à la charge max sous le « reps min » : c'est trop lourd, recule d'un incrément.</p>
          <h2 className="pt-2 text-base font-semibold text-foreground">Les indicateurs</h2>
          <p>1RM estimé = charge × (1 + reps / 30) (formule d'Epley, fiable surtout sous 10 reps), calculé sur chaque série ; on garde la meilleure. Volume = charge × reps. Record ★ = nouveau meilleur 1RM estimé. Stagnation = aucun record depuis 3 semaines ou plus (au moins 2 séances) : pense à une décharge, un changement de reps ou plus de récupération.</p>
          <p>Saisie : charge vide = même charge que la série précédente. Poids de corps pur : charge 0. Haltères : la charge d'une seule haltère. Écris toujours un exercice de la même façon.</p>
        </section>
      )}
    </>
  );
}
