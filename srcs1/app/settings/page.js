"use client";
import { useEffect, useState } from "react";
import Shell from "../../../lib/Shell";
import { useProfile } from "../../../lib/useProfile";

const OBJ = [["perte", "Perdre du poids"], ["muscle", "Prendre du muscle"], ["maintien", "Maintien"]];

export default function Page() {
  return <Shell title="Réglages" subtitle="Ton profil et tes objectifs"><Content /></Shell>;
}

function Content() {
  const { profile, loading, save } = useProfile();
  const [f, setF] = useState({ name: "", objective: "perte", goal_weight: 75, weekly_goal: 3 });
  const [msg, setMsg] = useState("");
  useEffect(() => { if (!loading) setF((x) => ({ ...x, ...profile })); }, [loading]);
  if (loading) return null;

  async function onSave() {
    const err = await save({
      name: f.name, objective: f.objective,
      goal_weight: parseFloat(String(f.goal_weight).replace(",", ".")) || 75,
      weekly_goal: parseInt(f.weekly_goal) || 3,
    });
    setMsg(err ? err.message : "Enregistré ✓");
  }

  return (
    <div className="panel max-w-lg space-y-5 p-6">
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Prénom</span>
        <input className="w-full" value={f.name ?? ""} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </label>
      <div className="space-y-2 text-sm">
        <span className="text-muted-foreground">Objectif</span>
        <div className="grid grid-cols-3 gap-2">
          {OBJ.map(([k, l]) => (
            <button key={k} onClick={() => setF({ ...f, objective: k })} className={`rounded-lg border p-2 text-xs ${f.objective === k ? "border-success bg-success/10 text-success" : "border-border hover:bg-accent"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Poids cible (kg)</span>
          <input className="w-full" value={f.goal_weight ?? ""} onChange={(e) => setF({ ...f, goal_weight: e.target.value })} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Séances par semaine</span>
          <input className="w-full" value={f.weekly_goal ?? ""} onChange={(e) => setF({ ...f, weekly_goal: e.target.value })} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow-success hover:brightness-110" onClick={onSave}>Enregistrer</button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}