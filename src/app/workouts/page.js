"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Trash2, Trophy } from "lucide-react";
import Shell from "../../../lib/Shell";
import { supabase } from "../../../lib/supabase";
import { e1rm, fmtSets, xpOf } from "../../../lib/stats";

const REP_MIN = 6, REP_MAX = 10, STEP = 2.5;
const DEFAULTS = ["Développé couché (barre)", "Développé militaire (haltère)", "Extensions triceps poulie", "Tractions lestées", "Tirage vertical", "Presse à cuisses"];

function parseSets(text) {
  const out = [];
  let kg = null;
  for (const t of text.trim().replace(/,/g, ".").split(/[\s;]+/).filter(Boolean)) {
    const m = t.toLowerCase().replace("×", "x").split("x");
    if (m.length === 2) { kg = parseFloat(m[0]); out.push({ kg, reps: parseInt(m[1]) }); }
    else if (kg !== null) out.push({ kg, reps: parseInt(m[0]) });
  }
  return out.filter((s) => !isNaN(s.kg) && s.reps > 0);
}
const best1rm = (sets) => Math.max(...sets.map(e1rm));

function target(sets) {
  const top = Math.max(...sets.map((s) => s.kg));
  const topSets = sets.filter((s) => s.kg === top);
  if (topSets.every((s) => s.reps >= REP_MAX)) return `▲ Monte à ${top + STEP} kg, vise ${REP_MIN} reps par série`;
  return `● Reste à ${top} kg, vise ${Math.max(...topSets.map((s) => s.reps)) + 1} reps`;
}

export default function Page() {
  return <Shell title="Mes séances" subtitle="Journal et surcharge progressive" pro><Content /></Shell>;
}

function Content() {
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [exercise, setExercise] = useState("");
  const [setsText, setSetsText] = useState("");
  const [rpe, setRpe] = useState("");
  const [flash, setFlash] = useState("");

  async function load() {
    const { data } = await supabase.from("workouts").select("*").order("date").order("id");
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);

  const names = [...new Set([...DEFAULTS, ...rows.map((r) => r.exercise)])];
  const history = rows.filter((r) => r.exercise.toLowerCase() === exercise.trim().toLowerCase());
  const last = history[history.length - 1];
  const chart = history.map((r) => ({ date: r.date, rm: +best1rm(r.sets).toFixed(1) }));
  const parsed = parseSets(setsText);

  const prs = new Set(), best = {};
  rows.forEach((r) => {
    const k = r.exercise.toLowerCase(), b = best1rm(r.sets);
    if (best[k] !== undefined && b > best[k]) prs.add(r.id);
    best[k] = Math.max(best[k] ?? 0, b);
  });

  async function add() {
    if (!exercise.trim() || parsed.length === 0) return;
    const prev = Math.max(0, ...history.map((r) => best1rm(r.sets)));
    const isPR = history.length > 0 && best1rm(parsed) > prev;
    await supabase.from("workouts").insert({ date, exercise: exercise.trim(), sets: parsed, rpe: rpe ? parseInt(rpe) : null });
    setFlash(`+${xpOf({ sets: parsed })} XP${isPR ? " · Nouveau record 🏆" : ""}`);
    setSetsText(""); setRpe(""); load();
  }
  async function remove(id) { await supabase.from("workouts").delete().eq("id", id); load(); }

  return (
    <>
      <div className="panel space-y-3 p-5">
        <div className="flex flex-wrap gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input list="exos" className="flex-1" placeholder="Exercice" value={exercise} onChange={(e) => setExercise(e.target.value)} />
          <datalist id="exos">{names.map((n) => <option key={n} value={n} />)}</datalist>
        </div>

        {last && (
          <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-sm">
            <div className="text-muted-foreground">Dernière fois : {fmtSets(last.sets)}</div>
            <div className="mt-1 font-semibold text-success">Objectif du jour : {target(last.sets)}</div>
          </div>
        )}

        <input className="w-full" placeholder="Séries : 70x8 9 9  (puis 62,5x10 pour changer de charge)" value={setsText} onChange={(e) => setSetsText(e.target.value)} />
        {parsed.length > 0 && <div className="text-xs text-muted-foreground">Compris : {fmtSets(parsed)}</div>}

        <div className="flex gap-2">
          <input className="w-24" placeholder="RPE" value={rpe} onChange={(e) => setRpe(e.target.value)} />
          <button className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-success hover:brightness-110" onClick={add}>Enregistrer</button>
        </div>
        {flash && <p className="text-sm font-medium text-streak">{flash}</p>}
      </div>

      {chart.length > 1 && (
        <div className="panel h-64 p-4">
          <p className="mb-1 text-sm text-muted-foreground">1RM estimé (kg)</p>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={chart}>
              <CartesianGrid stroke="#232b3d" vertical={false} />
              <XAxis dataKey="date" stroke="#8b95a9" fontSize={11} />
              <YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#8b95a9" fontSize={11} />
              <Tooltip contentStyle={{ background: "#111622", border: "1px solid #232b3d", borderRadius: 8 }} />
              <Line type="monotone" dataKey="rm" stroke="#34d399" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="panel divide-y divide-border">
        {rows.length === 0 && <p className="p-4 text-sm text-muted-foreground">Aucune séance. Enregistre ta première ci-dessus.</p>}
        {[...rows].reverse().map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-semibold">
                {r.exercise}
                {prs.has(r.id) && <Trophy className="h-4 w-4 text-streak" />}
              </div>
              <div className="truncate text-muted-foreground">{r.date} · {fmtSets(r.sets)}{r.rpe ? ` · RPE ${r.rpe}` : ""}</div>
            </div>
            <button className="text-muted-foreground hover:text-streak" onClick={() => remove(r.id)} aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </>
  );
}