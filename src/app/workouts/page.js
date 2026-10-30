"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../../../lib/supabase";
import { useSub } from "../../../lib/useSub";
import Paywall from "../../../lib/Paywall";

// Réglages de la double progression (comme ton Excel)
const REP_MIN = 6, REP_MAX = 10, STEP = 2.5;
const DEFAULTS = [
  "Développé couché (barre)", "Développé militaire (haltère)", "Extensions triceps poulie",
  "Tractions lestées", "Tirage vertical", "Presse à cuisses",
];

// "70x8 9 62,5x10" -> [{kg:70,reps:8},{kg:70,reps:9},{kg:62.5,reps:10}]
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

const e1rm = (s) => s.kg * (1 + s.reps / 30); // formule d'Epley
const best1rm = (sets) => Math.max(...sets.map(e1rm));
const fmt = (sets) => sets.map((s) => `${s.kg}×${s.reps}`).join(" · ");

// Objectif du jour à partir de la dernière séance
function target(sets) {
  const top = Math.max(...sets.map((s) => s.kg));
  const topSets = sets.filter((s) => s.kg === top);
  if (topSets.every((s) => s.reps >= REP_MAX))
    return `▲ Monte à ${top + STEP} kg, vise ${REP_MIN} reps par série`;
  const best = Math.max(...topSets.map((s) => s.reps));
  return `● Reste à ${top} kg, vise ${best + 1} reps`;
}

export default function Workouts() {
  const [logged, setLogged] = useState(null);
  const sub = useSub();
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [exercise, setExercise] = useState("");
  const [setsText, setSetsText] = useState("");
  const [rpe, setRpe] = useState("");

  async function load() {
    const { data } = await supabase.from("workouts").select("*").order("date");
    setRows(data ?? []);
  }
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLogged(!!data.session);
      if (data.session) load();
    });
  }, []);

  if (logged === null) return null;
  if (!logged) return <main className="p-4">Connecte-toi d'abord. <Link className="underline" href="/">Accueil</Link></main>;
  if (sub.loading) return null;
  if (!sub.active) return <Paywall />;

  const names = [...new Set([...DEFAULTS, ...rows.map((r) => r.exercise)])];
  const history = rows.filter((r) => r.exercise.toLowerCase() === exercise.trim().toLowerCase());
  const last = history[history.length - 1];
  const chart = history.map((r) => ({ date: r.date, rm: +best1rm(r.sets).toFixed(1) }));
  const parsed = parseSets(setsText);

  async function add() {
    if (!exercise.trim() || parsed.length === 0) return;
    await supabase.from("workouts").insert({
      date, exercise: exercise.trim(), sets: parsed, rpe: rpe ? parseInt(rpe) : null,
    });
    setSetsText(""); setRpe("");
    load();
  }

  async function remove(id) {
    await supabase.from("workouts").delete().eq("id", id);
    load();
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mes séances</h1>
        <Link className="text-sm underline" href="/">← Poids</Link>
      </div>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="flex gap-2">
          <input type="date" className="border rounded p-2" value={date} onChange={(e) => setDate(e.target.value)} />
          <input list="exos" className="border rounded p-2 flex-1" placeholder="Exercice" value={exercise} onChange={(e) => setExercise(e.target.value)} />
          <datalist id="exos">{names.map((n) => <option key={n} value={n} />)}</datalist>
        </div>

        {last && (
          <div className="text-sm bg-gray-100 rounded p-2">
            <div>Dernière fois : {fmt(last.sets)}</div>
            <div className="font-semibold">Objectif du jour : {target(last.sets)}</div>
          </div>
        )}

        <input className="w-full border rounded p-2" placeholder="Séries : 70x8 9 9  (puis 62,5x10 pour changer de charge)" value={setsText} onChange={(e) => setSetsText(e.target.value)} />
        {parsed.length > 0 && <div className="text-xs text-gray-500">Compris : {fmt(parsed)}</div>}

        <div className="flex gap-2">
          <input className="border rounded p-2 w-24" placeholder="RPE" value={rpe} onChange={(e) => setRpe(e.target.value)} />
          <button className="bg-black text-white rounded px-4 flex-1" onClick={add}>Enregistrer</button>
        </div>
      </div>

      {chart.length > 1 && (
        <div className="bg-white rounded-xl shadow p-4 h-60">
          <div className="text-sm text-gray-500 mb-1">1RM estimé (kg)</div>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={chart}>
              <XAxis dataKey="date" fontSize={11} />
              <YAxis domain={["dataMin - 2", "dataMax + 2"]} fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="rm" stroke="#111" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl shadow divide-y">
        {[...rows].reverse().map((r) => (
          <div key={r.id} className="p-3 flex justify-between gap-2 text-sm">
            <div>
              <div className="font-semibold">{r.exercise}</div>
              <div className="text-gray-500">{r.date} · {fmt(r.sets)}{r.rpe ? ` · RPE ${r.rpe}` : ""}</div>
            </div>
            <button className="text-red-600" onClick={() => remove(r.id)}>✕</button>
          </div>
        ))}
      </div>
    </main>
  );
}