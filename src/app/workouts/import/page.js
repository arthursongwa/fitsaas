"use client";
import { useState } from "react";
import Link from "next/link";
import Shell from "../../../../lib/Shell";
import { supabase } from "../../../../lib/supabase";
import { useProfile } from "../../../../lib/useProfile";
import { Err, Ok, btn, btn2 } from "../../../../lib/ui";

export default function Page() {
  return <Shell title="Importer mon Excel" subtitle="Reprends ton historique de surcharge progressive" pro action={<Link href="/workouts" className={btn2}>← Séances</Link>}><Content /></Shell>;
}

const iso = (v) => (typeof v === "number" ? new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10) : typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);
const num = (v) => (typeof v === "number" ? v : null);

function Content() {
  const { save } = useProfile();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState({ err: "", ok: "" });
  const [busy, setBusy] = useState(false);

  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setMsg({ err: "", ok: "" }); setData(null);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
      const sheet = (n) => (wb.Sheets[n] ? XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null }) : null);
      const J = sheet("Journal"), E = sheet("Exercices"), P = sheet("Poids de corps");
      if (!J || !E) return setMsg({ err: "Ce fichier ne ressemble pas à ton Excel (onglets « Journal » et « Exercices » introuvables).", ok: "" });

      const exercises = E.slice(4).filter((r) => r[0]).map((r) => ({ name: String(r[0]).trim(), muscle_group: r[1] || "Autre", target_sets: num(r[2]) || 3, rep_min: num(r[3]) || 6, rep_max: num(r[4]) || 10, increment: num(r[5]) || 2.5 }));
      let date = null; const workouts = [];
      for (const r of J.slice(5)) {
        const d = iso(r[0]); if (d) date = d;
        if (!r[1] || !date) continue;
        let kg = null; const sets = [];
        for (let i = 0; i < 4; i++) { const k = num(r[4 + 2 * i]), rp = num(r[5 + 2 * i]); if (k !== null) kg = k; if (rp && rp > 0) sets.push({ kg: kg ?? 0, reps: rp }); }
        if (sets.length) workouts.push({ date, exercise: String(r[1]).trim(), sets, rpe: num(r[12]) ? Math.round(r[12]) : null, notes: r[13] ? String(r[13]).slice(0, 300) : null });
      }
      const weights = (P || []).slice(4).map((r) => ({ date: iso(r[0]), weight: num(r[1]) })).filter((w) => w.date && w.weight >= 25 && w.weight <= 400);
      setData({ exercises, workouts, weights, start: iso(E[4]?.[8]), goal: num(E[7]?.[8]) });
    } catch (err) { setMsg({ err: `Lecture impossible : ${err.message}`, ok: "" }); }
  }

  async function run() {
    setBusy(true); setMsg({ err: "", ok: "" });
    try {
      const u = (await supabase.auth.getSession()).data.session.user.id;
      let r = await supabase.from("exercises").upsert(data.exercises.map((x) => ({ ...x, user_id: u })), { onConflict: "user_id,name", ignoreDuplicates: true });
      if (r.error) throw r.error;
      if (data.weights.length) { r = await supabase.from("weights").upsert(data.weights.map((w) => ({ ...w, user_id: u })), { onConflict: "user_id,date", ignoreDuplicates: true }); if (r.error) throw r.error; }
      const { data: ex, error } = await supabase.from("workouts").select("date,exercise");
      if (error) throw error;
      const seen = new Set(ex.map((w) => `${w.date}|${w.exercise.toLowerCase()}`));
      const fresh = data.workouts.filter((w) => !seen.has(`${w.date}|${w.exercise.toLowerCase()}`));
      for (let i = 0; i < fresh.length; i += 100) { r = await supabase.from("workouts").insert(fresh.slice(i, i + 100).map((w) => ({ ...w, user_id: u }))); if (r.error) throw r.error; }
      const patch = {}; if (data.start) patch.program_start = data.start; if (data.goal) { patch.training_days = data.goal; patch.weekly_goal = data.goal; }
      if (Object.keys(patch).length) await save(patch);
      setMsg({ err: "", ok: `Import terminé : ${fresh.length} exercice(s) de séance ajoutés (${data.workouts.length - fresh.length} déjà présents ignorés).` }); setData(null);
    } catch (e) { setMsg({ err: `Import interrompu : ${e.message}`, ok: "" }); }
    setBusy(false);
  }

  return (
    <section className="panel max-w-xl space-y-4 p-6">
      <p className="text-sm text-muted-foreground">Choisis ton fichier Excel « Surcharge progressive » (.xlsx). Il est lu dans ton navigateur : rien n'est envoyé tant que tu n'as pas confirmé. Les lignes déjà présentes (même date et même exercice) sont ignorées.</p>
      <input type="file" accept=".xlsx" onChange={onFile} className="w-full" />
      {data && (<div className="space-y-3 rounded-xl border border-success/40 bg-success/5 p-4 text-sm">
        <p className="font-medium">Prêt à importer :</p>
        <ul className="space-y-1 text-muted-foreground"><li>{data.workouts.length} lignes de séance (exercices)</li><li>{data.exercises.length} exercices configurés</li><li>{data.weights.length} pesées de poids de corps</li>{data.start && <li>Début du programme : {data.start}</li>}</ul>
        <button className={btn} disabled={busy} onClick={run}>{busy ? "Import en cours…" : "Importer"}</button>
      </div>)}
      <Err>{msg.err}</Err><Ok>{msg.ok}</Ok>
    </section>
  );
}
