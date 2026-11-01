"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, X, Plus } from "lucide-react";
import Shell from "../../../../lib/Shell";
import { supabase } from "../../../../lib/supabase";
import { useProfile } from "../../../../lib/useProfile";
import { Err, Ok, btn, btn2 } from "../../../../lib/ui";
import { generateProgram, ALL_EXOS } from "../../../../lib/exercises";

export default function Page() {
  return <Shell title="Mon programme" subtitle="Modifie tes séances" action={<Link href="/workouts" className={btn2}>← Séances</Link>}><Content /></Shell>;
}

function Content() {
  const { profile } = useProfile();
  const [prog, setProg] = useState(undefined);
  const [add, setAdd] = useState({});
  const [msg, setMsg] = useState({ err: "", ok: "" });
  useEffect(() => { supabase.from("programs").select("*").eq("active", true).limit(1).then(({ data }) => setProg(data?.[0] ?? { name: "Mon programme", days: [], active: true })); }, []);
  if (!prog) return null;
  const days = prog.days;
  const setDays = (fn) => setProg((p) => ({ ...p, days: fn(p.days) }));

  async function save() {
    const clean = days.filter((d) => d.name.trim()).map((d) => ({ name: d.name.trim(), exercises: d.exercises }));
    const { data, error } = prog.id
      ? await supabase.from("programs").update({ days: clean }).eq("id", prog.id).select().single()
      : await supabase.from("programs").insert({ name: prog.name, days: clean, active: true }).select().single();
    if (error) return setMsg({ err: error.message, ok: "" });
    setProg(data); setMsg({ err: "", ok: "Programme enregistré." });
  }
  function regenerate() {
    if (!confirm("Remplacer le programme affiché par un programme généré selon ton profil ? Rien n'est enregistré tant que tu ne cliques pas sur Enregistrer.")) return;
    setDays(() => generateProgram({ days: profile.training_days, place: profile.place, experience: profile.experience }));
  }
  const addEx = (i) => { const n = (add[i] || "").trim(); if (!n) return; setDays((ds) => ds.map((d, j) => (j === i && !d.exercises.includes(n) ? { ...d, exercises: [...d.exercises, n] } : d))); setAdd({ ...add, [i]: "" }); };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button className={btn} onClick={save}>Enregistrer</button>
        <button className={btn2} onClick={() => setDays((ds) => [...ds, { name: `Jour ${ds.length + 1}`, exercises: [] }])}><Plus className="h-4 w-4" /> Ajouter un jour</button>
        <button className={btn2} onClick={regenerate}>Régénérer depuis mon profil</button>
      </div>
      <Err>{msg.err}</Err><Ok>{msg.ok}</Ok>
      <datalist id="exos">{ALL_EXOS.map((n) => <option key={n} value={n} />)}</datalist>
      {days.length === 0 && <div className="panel p-6 text-sm text-muted-foreground">Aucun jour pour l'instant. Ajoute-en un ou régénère un programme.</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        {days.map((d, i) => (
          <section key={i} className="panel space-y-3 p-5">
            <div className="flex gap-2"><input className="flex-1 font-medium" aria-label="Nom du jour" value={d.name} onChange={(e) => setDays((ds) => ds.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /><button aria-label="Supprimer le jour" className="text-muted-foreground hover:text-streak" onClick={() => confirm(`Supprimer « ${d.name} » ?`) && setDays((ds) => ds.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button></div>
            <ul className="space-y-1 text-sm">{d.exercises.map((e) => (<li key={e} className="flex items-center justify-between"><span>{e}</span><button aria-label="Retirer" className="text-muted-foreground hover:text-streak" onClick={() => setDays((ds) => ds.map((x, j) => (j === i ? { ...x, exercises: x.exercises.filter((y) => y !== e) } : x)))}><X className="h-4 w-4" /></button></li>))}</ul>
            <div className="flex gap-2"><input list="exos" className="flex-1" placeholder="Ajouter un exercice" value={add[i] || ""} onChange={(e) => setAdd({ ...add, [i]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addEx(i)} /><button className={btn2} onClick={() => addEx(i)}>Ajouter</button></div>
          </section>
        ))}
      </div>
    </>
  );
}
