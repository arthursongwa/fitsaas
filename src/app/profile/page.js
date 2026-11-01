"use client";
import { useEffect, useState } from "react";
import Shell from "../../../lib/Shell";
import { supabase } from "../../../lib/supabase";
import { useProfile } from "../../../lib/useProfile";
import { Field, Choice, Err, Ok, btn, btn2 } from "../../../lib/ui";
import { ACTIVITY, OBJECTIVES, parseNum, isValidWeightKg, targets, ageFrom } from "../../../lib/calc";
export default function Page() { return <Shell title="Profil" subtitle="Tes informations et tes objectifs"><Content /></Shell>; }
function Content() {
  const { profile, loading, save } = useProfile();
  const [f, setF] = useState(null); const [msg, setMsg] = useState({ err: "", ok: "" }); const [plan, setPlan] = useState(null); const [lastW, setLastW] = useState(null);
  useEffect(() => {
    if (loading) return;
    setF(Object.fromEntries(Object.entries(profile).filter(([, v]) => v !== null)));
    supabase.from("weights").select("weight").order("date", { ascending: false }).limit(1).then(({ data }) => setLastW(data?.[0]?.weight ?? null));
  }, [loading]);
  if (!f) return null;
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const inp = (k) => ({ value: f[k] ?? "", onChange: (e) => set(k)(e.target.value) });
  async function onSave() {
    const by = Number(f.birth_year), h = parseNum(f.height_cm), g = parseNum(f.goal_weight);
    if (!(by >= 1930 && by <= new Date().getFullYear() - 18)) return setMsg({ err: "Année de naissance invalide (18 ans minimum).", ok: "" });
    if (!(h >= 120 && h <= 230)) return setMsg({ err: "Taille invalide (120 à 230 cm).", ok: "" });
    if (!isValidWeightKg(g)) return setMsg({ err: "Poids cible invalide.", ok: "" });
    const er = await save({ name: f.name || null, sex: f.sex, birth_year: by, height_cm: h, goal_weight: g, objective: f.objective, activity: f.activity, experience: f.experience, training_days: Number(f.training_days) || 3, weekly_goal: Number(f.training_days) || 3, session_minutes: Number(f.session_minutes) || 60, place: f.place, diet_prefs: f.diet_prefs || null, allergies: f.allergies || null, meals_per_day: Number(f.meals_per_day) || 3 });
    setMsg(er ? { err: er.message, ok: "" } : { err: "", ok: "Profil enregistré. Tes objectifs caloriques n'ont pas changé : utilise « Recalculer » pour les mettre à jour." });
  }
  function recalc() {
    const w = lastW ?? Number(profile.weight_kg_ref);
    const p = targets({ sex: f.sex, weightKg: w, heightCm: parseNum(f.height_cm), age: ageFrom(f.birth_year), activity: f.activity, objective: f.objective });
    if (!p) return setMsg({ err: "Impossible de calculer : vérifie sexe, âge, taille et activité, puis enregistre.", ok: "" });
    setMsg({ err: "", ok: "" }); setPlan({ ...p, w });
  }
  async function apply() {
    if (!plan) return;
    const er = await save({ 
      kcal_target: plan.kcal, 
      protein_g: plan.protein, 
      carbs_g: plan.carbs ?? plan.carbs_g, 
      fat_g: plan.fat ?? plan.fat_g 
    }); 
    setMsg(er ? { err: er.message, ok: "" } : { err: "", ok: "Nouveaux objectifs appliqués." }); 
    if (!er) setPlan(null); 
  }
  return (
    <div className="max-w-2xl space-y-5">
      <section className="panel space-y-4 p-6"><h2 className="font-semibold">Informations</h2>
        <Field label="Prénom"><input className="w-full" {...inp("name")} /></Field>
        <Field label="Sexe"><Choice cols={2} value={f.sex} onChange={set("sex")} options={[["h", "Homme"], ["f", "Femme"]]} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Année de naissance"><input className="w-full" inputMode="numeric" {...inp("birth_year")} /></Field>
          <Field label="Taille (cm)"><input className="w-full" inputMode="decimal" {...inp("height_cm")} /></Field>
          <Field label="Poids cible (kg)"><input className="w-full" inputMode="decimal" {...inp("goal_weight")} /></Field>
        </div>
        <Field label="Objectif"><Choice value={f.objective} onChange={set("objective")} options={Object.entries(OBJECTIVES)} /></Field>
        <Field label="Niveau d'activité"><select className="w-full" {...inp("activity")}>{Object.entries(ACTIVITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
      </section>
      <section className="panel space-y-4 p-6"><h2 className="font-semibold">Entraînement</h2>
        <Field label="Niveau"><Choice value={f.experience} onChange={set("experience")} options={[["debutant", "Débutant"], ["intermediaire", "Intermédiaire"], ["avance", "Avancé"]]} /></Field>
        <Field label="Séances par semaine"><Choice cols={5} value={f.training_days} onChange={set("training_days")} options={[[2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"]]} /></Field>
        <Field label="Durée (min)"><Choice cols={4} value={f.session_minutes} onChange={set("session_minutes")} options={[[30, "30"], [45, "45"], [60, "60"], [90, "90"]]} /></Field>
        <Field label="Lieu"><Choice cols={2} value={f.place} onChange={set("place")} options={[["salle", "Salle"], ["maison", "Maison"]]} /></Field>
      </section>
      <section className="panel space-y-4 p-6"><h2 className="font-semibold">Alimentation</h2>
        <Field label="Préférences"><input className="w-full" {...inp("diet_prefs")} /></Field>
        <Field label="Allergies ou restrictions"><input className="w-full" {...inp("allergies")} /></Field>
        <Field label="Repas par jour"><Choice cols={3} value={f.meals_per_day} onChange={set("meals_per_day")} options={[[3, "3"], [4, "4"], [5, "5"]]} /></Field>
      </section>
      <div className="flex flex-wrap gap-3"><button className={btn} onClick={onSave}>Enregistrer le profil</button><button className={btn2} onClick={recalc}>Recalculer mes objectifs</button></div>
      <Err>{msg.err}</Err><Ok>{msg.ok}</Ok>
      {plan && (<section className="panel space-y-3 border-success/40 p-6"><h2 className="font-semibold">Changement proposé</h2>
        <p className="text-sm text-muted-foreground">Calculé avec ton dernier poids ({plan.w} kg). Rien n'est modifié tant que tu n'as pas confirmé.</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-muted p-3"><div className="text-xs text-muted-foreground">Actuel</div>{profile.kcal_target ? `${profile.kcal_target} kcal · P ${profile.protein_g} G ${profile.carbs_g} L ${profile.fat_g}` : "Aucun"}</div>
          <div className="rounded-xl border border-success/40 bg-success/5 p-3"><div className="text-xs text-muted-foreground">Nouveau</div>{plan.kcal} kcal · P {plan.protein} G {plan.carbs} L {plan.fat}</div>
        </div>
        {plan.floorApplied && <p className="text-xs text-streak">Relevé à un minimum de sécurité.</p>}
        <div className="flex gap-3"><button className={btn} onClick={apply}>Appliquer</button><button className={btn2} onClick={() => setPlan(null)}>Annuler</button></div></section>)}
    </div>);
}
