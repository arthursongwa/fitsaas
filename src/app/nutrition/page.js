"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import Shell from "../../../lib/Shell";
import { supabase } from "../../../lib/supabase";
import { useProfile } from "../../../lib/useProfile";
import { Bar, Err, btn, btn2 } from "../../../lib/ui";
import { isoDay, shiftIso, parseNum, scaleFood, sumEntries, profileTargets } from "../../../lib/calc";

const MEALS = [["petit-dej", "Petit-déjeuner"], ["dejeuner", "Déjeuner"], ["diner", "Dîner"], ["collation", "Collations"]];
export default function Page() { return <Shell title="Nutrition" subtitle="Journal alimentaire" pro><Content /></Shell>; }

function Content() {
  const { profile } = useProfile();
  const [date, setDate] = useState(isoDay());
  const [entries, setEntries] = useState([]);
  const [meal, setMeal] = useState(null);
  const [q, setQ] = useState("");
  const [res, setRes] = useState([]);
  const [food, setFood] = useState(null);
  const [grams, setGrams] = useState("100");
  const [custom, setCustom] = useState(false);
  const [cf, setCf] = useState({ name: "", kcal: "", p: "", c: "", f: "" });
  const [err, setErr] = useState("");
  const target = profileTargets(profile);
  const tot = sumEntries(entries) || { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  async function load() { const { data, error } = await supabase.from("food_entries").select("*").eq("date", date).order("id"); if (error) setErr(error.message); setEntries(data ?? []); }
  useEffect(() => { load(); }, [date]);
  useEffect(() => {
    if (!q.trim()) { setRes([]); return; }
    const t = setTimeout(async () => { const { data } = await supabase.from("foods").select("*").ilike("name", `%${q.trim()}%`).order("name").limit(12); setRes(data ?? []); }, 250);
    return () => clearTimeout(t);
  }, [q]);
  function open(m) { setMeal(meal === m ? null : m); setFood(null); setQ(""); setCustom(false); setErr(""); }
  async function add() {
    const g = parseNum(grams);
    if (!food || !(g > 0 && g <= 5000)) return setErr("Choisis un aliment et une quantité valide en grammes (jusqu'à 5000).");
    const { error } = await supabase.from("food_entries").insert({ date, meal, name: food.name, grams: g, ...scaleFood(food, g), food_id: food.id });
    if (error) return setErr(error.message);
    setErr(""); setFood(null); setQ(""); setGrams("100"); load();
  }
  async function remove(id) { if (!confirm("Supprimer cette entrée ?")) return; const { error } = await supabase.from("food_entries").delete().eq("id", id); if (error) setErr(error.message); else load(); }
  async function createFood() {
    const k = parseNum(cf.kcal), p = parseNum(cf.p || "0"), c = parseNum(cf.c || "0"), f = parseNum(cf.f || "0");
    if (!cf.name.trim() || !(k >= 0 && k <= 900) || ![p, c, f].every((v) => v >= 0 && v <= 100)) return setErr("Renseigne un nom, des calories (0 à 900) et des macros (0 à 100 g) pour 100 g.");
    const { data, error } = await supabase.from("foods").insert({ name: cf.name.trim(), kcal100: k, protein100: p, carbs100: c, fat100: f }).select().single();
    if (error) return setErr(error.message);
    setErr(""); setCustom(false); setCf({ name: "", kcal: "", p: "", c: "", f: "" }); setFood(data);
  }
  const left = target ? target.kcal - tot.kcal : null;
  const macro = (label, v, t) => (<div><div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span>{v}{t ? ` / ${t}` : ""} g</span></div><div className="mt-1"><Bar value={t ? (v / t) * 100 : 0} tone={t && v > t ? "streak" : "success"} /></div></div>);
  const pv = food ? scaleFood(food, parseNum(grams) || 0) : null;

  return (<>
    <div className="flex items-center justify-center gap-3">
      <button className={btn2} aria-label="Jour précédent" onClick={() => setDate(shiftIso(date, -1))}><ChevronLeft className="h-4 w-4" /></button>
      <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
      <button className={btn2} aria-label="Jour suivant" onClick={() => setDate(shiftIso(date, 1))}><ChevronRight className="h-4 w-4" /></button>
    </div>
    <section className="panel space-y-4 p-6">
      {target ? (<>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-3xl font-semibold tracking-tight">{tot.kcal} <span className="text-base font-normal text-muted-foreground">/ {target.kcal} kcal</span></p>
          <p className={`text-sm font-medium ${left < 0 ? "text-streak" : "text-success"}`}>{left >= 0 ? `${left} kcal restantes` : `${-left} kcal au-dessus de l'objectif`}</p>
        </div>
        <Bar value={(tot.kcal / target.kcal) * 100} tone={left < 0 ? "streak" : "success"} />
        <div className="grid gap-4 sm:grid-cols-3">{macro("Protéines", tot.protein, target.protein)}{macro("Glucides", tot.carbs, target.carbs)}{macro("Lipides", tot.fat, target.fat)}</div>
      </>) : <p className="text-sm text-muted-foreground">Aucun objectif calorique défini. <Link className="text-success underline" href="/profile">Calcule-le dans ton profil</Link>.</p>}
    </section>
    <Err>{err}</Err>
    {MEALS.map(([key, label]) => {
      const list = entries.filter((e) => e.meal === key);
      const s = sumEntries(list);
      return (
        <section key={key} className="panel p-5">
          <div className="flex items-center justify-between"><h3 className="font-semibold">{label} <span className="ml-2 text-sm font-normal text-muted-foreground">{s.kcal} kcal</span></h3><button className={btn2} onClick={() => open(key)}><Plus className="h-4 w-4" /> Ajouter</button></div>
          {list.length === 0 && meal !== key && <p className="mt-3 text-sm text-muted-foreground">Rien d'enregistré pour ce repas.</p>}
          <ul className="mt-2 divide-y divide-border">{list.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0"><p className="truncate font-medium">{e.name}</p><p className="text-xs text-muted-foreground">{e.grams} g · P {e.protein} · G {e.carbs} · L {e.fat}</p></div>
              <div className="flex items-center gap-3"><span className="font-mono">{Math.round(e.kcal)} kcal</span><button className="text-muted-foreground hover:text-streak" aria-label="Supprimer" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4" /></button></div>
            </li>))}</ul>
          {meal === key && (
            <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              {!food && !custom && (<>
                <input autoFocus className="w-full" placeholder="Rechercher un aliment (poulet, riz, banane…)" value={q} onChange={(e) => setQ(e.target.value)} />
                {res.map((r) => (<button key={r.id} className="flex w-full justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => setFood(r)}><span>{r.name}</span><span className="text-muted-foreground">{Math.round(r.kcal100)} kcal / 100 g</span></button>))}
                {q.trim() && res.length === 0 && <p className="text-sm text-muted-foreground">Aucun résultat.</p>}
                <button className="text-sm text-success underline" onClick={() => setCustom(true)}>Créer mon propre aliment</button>
              </>)}
              {custom && (<>
                <p className="text-sm font-medium">Nouvel aliment (valeurs pour 100 g)</p>
                <input className="w-full" placeholder="Nom" value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} />
                <div className="grid grid-cols-4 gap-2">{[["kcal", "kcal"], ["p", "Prot."], ["c", "Gluc."], ["f", "Lip."]].map(([k, l]) => <input key={k} inputMode="decimal" placeholder={l} value={cf[k]} onChange={(e) => setCf({ ...cf, [k]: e.target.value })} />)}</div>
                <div className="flex gap-2"><button className={btn} onClick={createFood}>Créer</button><button className={btn2} onClick={() => setCustom(false)}>Annuler</button></div>
              </>)}
              {food && (<>
                <p className="font-medium">{food.name}</p>
                <div className="flex items-center gap-2"><input className="w-28" inputMode="decimal" value={grams} onChange={(e) => setGrams(e.target.value)} aria-label="Quantité en grammes" /><span className="text-sm text-muted-foreground">grammes</span></div>
                {pv && <p className="text-sm text-muted-foreground">{pv.kcal} kcal · P {pv.protein} g · G {pv.carbs} g · L {pv.fat} g</p>}
                <div className="flex gap-2"><button className={btn} onClick={add}>Ajouter au journal</button><button className={btn2} onClick={() => setFood(null)}>Changer</button></div>
              </>)}
            </div>)}
        </section>);
    })}
    <p className="text-xs text-muted-foreground">Les valeurs nutritionnelles des aliments communs sont indicatives.</p>
  </>);
}
