"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Pencil, Download } from "lucide-react";
import Shell from "../../../../lib/Shell";
import { supabase } from "../../../../lib/supabase";
import { useProfile } from "../../../../lib/useProfile";
import { Err, Ok, Field, btn, btn2, download } from "../../../../lib/ui";
import { isoDay, shiftIso, parseNum, isValidWeightKg, fromUnit, toUnit } from "../../../../lib/calc";
export default function Page() { return <Shell title="Mes pesées" subtitle="Historique du poids" action={<Link href="/progress" className={btn2}>← Progrès</Link>}><Content /></Shell>; }
function Content() {
  const { profile } = useProfile(); const unit = profile.unit || "kg";
  const [rows, setRows] = useState(null); const [date, setDate] = useState(isoDay()); const [w, setW] = useState(""); const [note, setNote] = useState(""); const [period, setPeriod] = useState("90");
  const [msg, setMsg] = useState({ err: "", ok: "" });
  async function load() { const { data } = await supabase.from("weights").select("*").order("date", { ascending: false }); setRows(data ?? []); }
  useEffect(() => { load(); }, []);
  if (!rows) return null;
  const toKg = (v) => Math.round(fromUnit(parseNum(v), unit) * 10) / 10;
  async function add() {
    const kg = toKg(w);
    if (!isValidWeightKg(kg)) return setMsg({ err: `Entre un poids valide (${unit}).`, ok: "" });
    if (date > isoDay()) return setMsg({ err: "La date ne peut pas être dans le futur.", ok: "" });
    const exists = rows.find((r) => r.date === date);
    if (exists && !confirm(`Une pesée existe déjà le ${date} (${toUnit(exists.weight, unit).toFixed(1)} ${unit}). La remplacer ?`)) return;
    const { data: s } = await supabase.auth.getSession();
    const { error } = await supabase.from("weights").upsert({ user_id: s.session.user.id, date, weight: kg, note: note.trim() || null }, { onConflict: "user_id,date" });
    if (error) return setMsg({ err: error.message, ok: "" });
    setW(""); setNote(""); setMsg({ err: "", ok: "Pesée enregistrée." }); load();
  }
  async function edit(r) {
    const v = prompt(`Nouveau poids pour le ${r.date} (${unit})`, toUnit(r.weight, unit).toFixed(1));
    if (v === null) return;
    const kg = toKg(v);
    if (!isValidWeightKg(kg)) return setMsg({ err: "Poids invalide : rien n'a été modifié.", ok: "" });
    const { error } = await supabase.from("weights").update({ weight: kg }).eq("id", r.id);
    if (error) return setMsg({ err: error.message, ok: "" });
    setMsg({ err: "", ok: "Pesée modifiée." }); load();
  }
  async function remove(r) { if (!confirm(`Supprimer la pesée du ${r.date} ?`)) return; const { error } = await supabase.from("weights").delete().eq("id", r.id); if (error) setMsg({ err: error.message, ok: "" }); else load(); }
  const from = period === "all" ? "" : shiftIso(isoDay(), -Number(period));
  const shown = rows.filter((r) => r.date >= from);
  const exportCsv = () => download("date,poids_kg,note\n" + rows.map((r) => `${r.date},${r.weight},"${(r.note || "").replace(/"/g, '""')}"`).join("\n"), "poids.csv", "text/csv");
  return (<>
    <section className="panel space-y-3 p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Date"><input type="date" className="w-full" max={isoDay()} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label={`Poids (${unit})`}><input className="w-full" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} /></Field>
        <Field label="Note (facultatif)"><input className="w-full" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
      <button className={btn} onClick={add}>Enregistrer la pesée</button><Err>{msg.err}</Err><Ok>{msg.ok}</Ok>
    </section>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="30">30 jours</option><option value="90">90 jours</option><option value="365">1 an</option><option value="all">Tout</option></select>
      <button className={btn2} onClick={exportCsv}><Download className="h-4 w-4" /> Exporter en CSV</button>
    </div>
    <div className="panel divide-y divide-border">
      {shown.length === 0 && <p className="p-4 text-sm text-muted-foreground">Aucune pesée sur cette période.</p>}
      {shown.map((r) => (<div key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
        <div><span className="text-muted-foreground">{r.date}</span>{r.note && <span className="ml-3 text-xs text-muted-foreground">{r.note}</span>}</div>
        <div className="flex items-center gap-4"><span className="font-medium">{toUnit(r.weight, unit).toFixed(1)} {unit}</span><button aria-label="Modifier" className="text-muted-foreground hover:text-foreground" onClick={() => edit(r)}><Pencil className="h-4 w-4" /></button><button aria-label="Supprimer" className="text-muted-foreground hover:text-streak" onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></button></div>
      </div>))}
    </div>
  </>);
}
