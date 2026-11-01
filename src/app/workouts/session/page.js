"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import Shell from "../../../../lib/Shell";
import { supabase } from "../../../../lib/supabase";
import { Err, btn, btn2 } from "../../../../lib/ui";
import { isoDay, parseSets, fmtSets, nextTarget, best1rm, xpOf } from "../../../../lib/calc";
import { ALL_EXOS } from "../../../../lib/exercises";
export default function Page() { return <Shell title="Séance en cours" subtitle="Chaque exercice est enregistré dès que tu le valides" pro><Content /></Shell>; }
function Content() {
  const [ctx, setCtx] = useState(null);
  const [extra, setExtra] = useState([]);
  const [name, setName] = useState("");
  useEffect(() => { (async () => {
    const q = new URLSearchParams(window.location.search).get("day");
    const [a, b] = await Promise.all([supabase.from("programs").select("*").eq("active", true).limit(1), supabase.from("workouts").select("*").order("date").order("id")]);
    const days = a.data?.[0]?.days ?? [];
    const day = q && q !== "free" ? days[Number(q)] : null;
    setCtx({ dayName: day?.name ?? null, exercises: day?.exercises ?? [], hist: b.data ?? [] });
  })(); }, []);
  if (!ctx) return null;
  const list = [...ctx.exercises, ...extra];
  const names = [...new Set([...ALL_EXOS, ...ctx.hist.map((r) => r.exercise)])];
  function addExtra() { const n = name.trim(); if (!n || list.some((x) => x.toLowerCase() === n.toLowerCase())) return; setExtra([...extra, n]); setName(""); }
  return (<>
    {ctx.dayName && <p className="text-lg font-medium">{ctx.dayName}</p>}
    {list.length === 0 && <p className="text-sm text-muted-foreground">Séance libre : ajoute ton premier exercice ci-dessous.</p>}
    {list.map((n) => <ExerciseCard key={n} name={n} dayName={ctx.dayName} hist={ctx.hist.filter((r) => r.exercise.toLowerCase() === n.toLowerCase())} />)}
    <div className="panel flex gap-2 p-4">
      <input list="exos" className="flex-1" placeholder="Ajouter un exercice" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addExtra()} />
      <datalist id="exos">{names.map((n) => <option key={n} value={n} />)}</datalist>
      <button className={btn2} onClick={addExtra}>Ajouter</button>
    </div>
    <Link href="/workouts" className={btn}><Check className="h-4 w-4" /> Terminer la séance</Link>
  </>);
}
function ExerciseCard({ name, dayName, hist }) {
  const last = hist[hist.length - 1];
  const target = last ? nextTarget(last.sets) : null;
  const [text, setText] = useState(""); const [rpe, setRpe] = useState("");
  const [saved, setSaved] = useState(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const parsed = parseSets(text);
  async function save() {
    if (parsed.length === 0) return setErr("Saisis tes séries, par exemple : 70x8 9 9 (kg × répétitions).");
    const r = rpe ? parseInt(rpe, 10) : null;
    if (rpe && !(r >= 1 && r <= 10)) return setErr("Le RPE doit être entre 1 et 10.");
    setBusy(true);
    const { error } = await supabase.from("workouts").insert({ date: isoDay(), exercise: name, sets: parsed, rpe: r, day_name: dayName });
    setBusy(false);
    if (error) return setErr(error.message);
    const prev = Math.max(0, ...hist.map((x) => best1rm(x.sets)));
    setSaved({ sets: parsed, pr: hist.length > 0 && best1rm(parsed) > prev }); setErr("");
  }
  return (
    <section className={`panel space-y-3 p-5 ${saved ? "border-success/50" : ""}`}>
      <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{name}</h3>{saved && <Check className="h-5 w-5 text-success" />}</div>
      {last && <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-sm"><div className="text-muted-foreground">Dernière fois ({last.date}) : {fmtSets(last.sets)}</div><div className="mt-1 font-semibold text-success">Objectif : {target.text}</div></div>}
      {saved ? (<p className="text-sm font-medium text-success">Enregistré : {fmtSets(saved.sets)} · +{xpOf({ sets: saved.sets })} XP{saved.pr ? " · Nouveau record 🏆" : ""}</p>) : (<>
        <input className="w-full" placeholder="Séries : 70x8 9 9 (puis 62,5x10 pour changer de charge)" value={text} onChange={(e) => setText(e.target.value)} />
        {parsed.length > 0 && <p className="text-xs text-muted-foreground">Compris : {fmtSets(parsed)}</p>}
        <div className="flex gap-2"><input className="w-24" inputMode="numeric" placeholder="RPE" value={rpe} onChange={(e) => setRpe(e.target.value)} /><button className={`${btn} flex-1`} disabled={busy} onClick={save}>Valider</button></div>
        <Err>{err}</Err></>)}
    </section>);
}
