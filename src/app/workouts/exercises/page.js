"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Plus } from "lucide-react";
import Shell from "../../../../lib/Shell";
import { supabase } from "../../../../lib/supabase";
import { useProfile } from "../../../../lib/useProfile";
import { useExercises } from "../../../../lib/useExercises";
import { Field, Err, Ok, btn, btn2 } from "../../../../lib/ui";
import { DEFAULT_EXERCISES, GROUPS } from "../../../../lib/exercises";
import { mondayIso } from "../../../../lib/analytics";

export default function Page() {
  return <Shell title="Exercices & réglages" subtitle="Fourchette de reps et incrément de chaque exercice" action={<Link href="/workouts" className={btn2}>← Séances</Link>}><Content /></Shell>;
}

const cell = "w-full text-center";
function Content() {
  const { list, reload } = useExercises();
  const { profile, loading, save } = useProfile();
  const [rows, setRows] = useState(null);
  const [nw, setNw] = useState({ name: "", muscle_group: GROUPS[0] || "Autre", target_sets: 3, rep_min: 6, rep_max: 10, increment: 2.5 });
  const [start, setStart] = useState("");
  const [msg, setMsg] = useState({ err: "", ok: "" });
  useEffect(() => { if (list) setRows(list.map((e) => ({ ...e, increment: Number(e.increment) }))); }, [list]);
  useEffect(() => { if (!loading) setStart(profile.program_start || ""); }, [loading]);
  if (!rows || loading) return null;
  const set = (i, k, v) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const clean = (r) => ({ name: r.name.trim(), muscle_group: r.muscle_group, target_sets: Number(r.target_sets), rep_min: Number(r.rep_min), rep_max: Number(r.rep_max), increment: Number(String(r.increment).replace(",", ".")) });
  const valid = (c) => c.name && c.target_sets >= 1 && c.target_sets <= 6 && c.rep_min >= 1 && c.rep_max >= c.rep_min && c.increment > 0;
  const uid = async () => (await supabase.auth.getSession()).data.session.user.id;

  async function saveAll() {
    const cs = rows.map(clean);
    if (!cs.every(valid)) return setMsg({ err: "Vérifie chaque ligne : séries 1 à 6, reps max ≥ reps min, incrément > 0.", ok: "" });
    const u = await uid();
    const { error } = await supabase.from("exercises").upsert(cs.map((c) => ({ ...c, user_id: u })), { onConflict: "user_id,name" });
    if (error) return setMsg({ err: error.message, ok: "" });
    setMsg({ err: "", ok: "Réglages enregistrés." }); reload();
  }
  async function addOne() {
    const c = clean(nw);
    if (!valid(c)) return setMsg({ err: "Renseigne un nom et des valeurs cohérentes.", ok: "" });
    if (rows.some((r) => r.name.toLowerCase() === c.name.toLowerCase())) return setMsg({ err: "Cet exercice existe déjà.", ok: "" });
    const { error } = await supabase.from("exercises").insert(c);
    if (error) return setMsg({ err: error.message, ok: "" });
    setNw({ ...nw, name: "" }); setMsg({ err: "", ok: "Exercice ajouté." }); reload();
  }
  async function remove(r) {
    if (!confirm(`Supprimer « ${r.name} » de la liste ? Tes séances passées sont conservées.`)) return;
    const { error } = await supabase.from("exercises").delete().eq("id", r.id);
    if (error) setMsg({ err: error.message, ok: "" }); else reload();
  }
  async function seed() {
    const u = await uid();
    const { error } = await supabase.from("exercises").upsert(DEFAULT_EXERCISES.map((e) => ({ ...e, user_id: u })), { onConflict: "user_id,name", ignoreDuplicates: true });
    if (error) return setMsg({ err: error.message, ok: "" });
    setMsg({ err: "", ok: "Exercices types ajoutés." }); reload();
  }
  async function saveStart() {
    if (start && new Date(start + "T12:00:00").getDay() !== 1 && !confirm("Cette date n'est pas un lundi. Utiliser le lundi de cette semaine ?")) return;
    const v = start ? mondayIso(start) : null;
    const er = await save({ program_start: v });
    if (!er) setStart(v || "");
    setMsg(er ? { err: er.message, ok: "" } : { err: "", ok: "Début du programme enregistré." });
  }

  return (
    <>
      <section className="panel space-y-3 p-5">
        <h2 className="font-semibold">Réglages</h2>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Début du programme (lundi de la semaine 1)" hint="Sert à numéroter les semaines. Vide = 1re séance saisie."><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <button className={btn2} onClick={saveStart}>Enregistrer</button>
          <p className="text-sm text-muted-foreground">Objectif de séances par semaine : réglable dans ton <Link className="text-success underline" href="/profile">profil</Link>.</p>
        </div>
      </section>
      <Err>{msg.err}</Err><Ok>{msg.ok}</Ok>
      <datalist id="groups">{GROUPS.map((g) => <option key={g} value={g} />)}</datalist>
      <section className="panel p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Mes exercices ({rows.length})</h2><div className="flex gap-2"><button className={btn2} onClick={seed}>Ajouter les exercices types</button><button className={btn} onClick={saveAll}>Enregistrer tout</button></div></div>
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Aucun exercice configuré. Les exercices inconnus utilisent 3 séries, 6 à 10 reps, +2,5 kg. Ajoute les exercices types ou crée les tiens.</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-2 text-left">Exercice</th><th>Groupe</th><th>Séries</th><th>Reps min</th><th>Reps max</th><th>Incr. (kg)</th><th /></tr></thead><tbody className="divide-y divide-border">
          {rows.map((r, i) => (<tr key={r.id}><td className="py-2 pr-2">{r.name}</td>
            <td><select className={cell} value={r.muscle_group || "Autre"} onChange={(e) => set(i, "muscle_group", e.target.value)}>{[...new Set([...GROUPS, r.muscle_group || "Autre"])].map((g) => <option key={g}>{g}</option>)}</select></td>
            {["target_sets", "rep_min", "rep_max", "increment"].map((k) => <td key={k} className="px-1"><input className={cell} inputMode="decimal" value={r[k]} onChange={(e) => set(i, k, e.target.value)} /></td>)}
            <td><button aria-label="Supprimer" className="text-muted-foreground hover:text-streak" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></button></td></tr>))}
        </tbody></table></div>
      </section>
      <section className="panel space-y-3 p-5">
        <h2 className="font-semibold">Nouvel exercice</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          <input className="col-span-2" placeholder="Nom (écris-le toujours pareil)" value={nw.name} onChange={(e) => setNw({ ...nw, name: e.target.value })} />
          <input list="groups" value={nw.muscle_group} onChange={(e) => setNw({ ...nw, muscle_group: e.target.value })} aria-label="Groupe" />
          {[["target_sets", "Séries"], ["rep_min", "Reps min"], ["rep_max", "Reps max"]].map(([k, l]) => <input key={k} inputMode="numeric" placeholder={l} value={nw[k]} onChange={(e) => setNw({ ...nw, [k]: e.target.value })} aria-label={l} />)}
        </div>
        <div className="flex items-center gap-3"><input className="w-28" inputMode="decimal" value={nw.increment} onChange={(e) => setNw({ ...nw, increment: e.target.value })} aria-label="Incrément en kg" /><span className="text-sm text-muted-foreground">kg d'incrément</span><button className={btn} onClick={addOne}><Plus className="h-4 w-4" /> Ajouter</button></div>
      </section>
    </>
  );
}
