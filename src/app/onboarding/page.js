"use client";
import { useEffect, useState } from "react";
import Shell from "../../../lib/Shell";
import { supabase } from "../../../lib/supabase";
import { useProfile } from "../../../lib/useProfile";
import { Field, Choice, Err, Bar, btn, btn2 } from "../../../lib/ui";
import { ACTIVITY, OBJECTIVES, parseNum, isValidWeightKg, targets, ageFrom, isoDay } from "../../../lib/calc";
import { generateProgram } from "../../../lib/exercises";

export default function Page() {
  return <Shell title="Bienvenue" subtitle="Quelques questions pour personnaliser ton plan" bare><Content /></Shell>;
}

const DEF = { name: "", sex: "h", birth_year: "", height_cm: "", weight: "", objective: "perte", goal_weight: "", activity: "modere", diet_prefs: "", allergies: "", meals_per_day: 3, experience: "debutant", training_days: 3, session_minutes: 60, place: "salle" };

function Content() {
  const { profile, loading, save } = useProfile();
  const [f, setF] = useState(null);
  const [step, setStep] = useState(1);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const inp = (k) => ({ value: f[k] ?? "", onChange: (e) => set(k)(e.target.value) });

  useEffect(() => {
    if (loading) return;
    (async () => {
      const { data: w } = await supabase.from("weights").select("weight").order("date", { ascending: false }).limit(1);
      const p = Object.fromEntries(Object.entries(profile).filter(([, v]) => v !== null));
      setF({ ...DEF, ...p, weight: p.weight_kg_ref ?? w?.[0]?.weight ?? "" });
      setStep(Math.min(Math.max(profile.onboarding_step || 1, 1), 4));
    })();
  }, [loading]);
  if (!f) return null;

  const year = new Date().getFullYear();
  function check(s) {
    if (s === 1) {
      const by = Number(f.birth_year), h = parseNum(f.height_cm);
      if (!(by >= 1930 && by <= year - 18)) return "Entre une année de naissance valide. L'application s'adresse aux adultes (18 ans minimum).";
      if (!(h >= 120 && h <= 230)) return "Entre une taille valide en cm (120 à 230).";
      if (!isValidWeightKg(parseNum(f.weight))) return "Entre un poids actuel valide en kg.";
      if (!isValidWeightKg(parseNum(f.goal_weight))) return "Entre un poids cible valide en kg.";
    }
    return "";
  }
  const patchFor = (s) => s === 1
    ? { name: f.name, sex: f.sex, birth_year: Number(f.birth_year), height_cm: parseNum(f.height_cm), weight_kg_ref: parseNum(f.weight), objective: f.objective, goal_weight: parseNum(f.goal_weight), activity: f.activity }
    : s === 2 ? { diet_prefs: f.diet_prefs, allergies: f.allergies, meals_per_day: Number(f.meals_per_day) }
    : { experience: f.experience, training_days: Number(f.training_days), weekly_goal: Number(f.training_days), session_minutes: Number(f.session_minutes), place: f.place };

  async function next() {
    const e = check(step);
    if (e) return setErr(e);
    setBusy(true);
    const er = await save({ ...patchFor(step), onboarding_step: step + 1 });
    setBusy(false);
    if (er) return setErr(er.message);
    setErr(""); setStep(step + 1);
  }

  const plan = step === 4 ? targets({ sex: f.sex, weightKg: parseNum(f.weight), heightCm: parseNum(f.height_cm), age: ageFrom(f.birth_year), activity: f.activity, objective: f.objective }) : null;
  const program = step === 4 ? generateProgram({ days: f.training_days, place: f.place, experience: f.experience }) : [];

  async function confirm() {
    if (!plan) return setErr("Impossible de calculer ton plan : reviens vérifier les étapes précédentes.");
    setBusy(true);
    const { data: s } = await supabase.auth.getSession();
    const uid = s.session.user.id;
    await supabase.from("programs").delete().eq("user_id", uid);
    const { error: pe } = await supabase.from("programs").insert({ name: "Mon programme", days: program, active: true });
    if (pe) { setBusy(false); return setErr(pe.message); }
    await supabase.from("weights").upsert({ user_id: uid, date: isoDay(), weight: parseNum(f.weight) }, { onConflict: "user_id,date", ignoreDuplicates: true });
    const er = await save({ kcal_target: plan.kcal, protein_g: plan.protein, carbs_g: plan.carbs, fat_g: plan.fat, onboarding_step: 4, onboarded: true });
    if (er) { setBusy(false); return setErr(er.message); }
    window.location.href = "/";
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2"><p className="text-sm text-muted-foreground">Étape {step} sur 4</p><Bar value={step * 25} /></div>
      <div className="panel space-y-4 p-6">
        {step === 1 && (<>
          <h2 className="text-lg font-semibold">Ton profil</h2>
          <Field label="Prénom (facultatif)"><input className="w-full" {...inp("name")} /></Field>
          <Field label="Sexe (sert au calcul des besoins)"><Choice cols={2} value={f.sex} onChange={set("sex")} options={[["h", "Homme"], ["f", "Femme"]]} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Année de naissance"><input className="w-full" inputMode="numeric" placeholder="1998" {...inp("birth_year")} /></Field>
            <Field label="Taille (cm)"><input className="w-full" inputMode="decimal" placeholder="178" {...inp("height_cm")} /></Field>
            <Field label="Poids actuel (kg)"><input className="w-full" inputMode="decimal" {...inp("weight")} /></Field>
            <Field label="Poids cible (kg)"><input className="w-full" inputMode="decimal" {...inp("goal_weight")} /></Field>
          </div>
          <Field label="Objectif"><Choice value={f.objective} onChange={set("objective")} options={Object.entries(OBJECTIVES)} /></Field>
          <Field label="Niveau d'activité au quotidien">
            <select className="w-full" {...inp("activity")}>{Object.entries(ACTIVITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          </Field>
        </>)}
        {step === 2 && (<>
          <h2 className="text-lg font-semibold">Alimentation</h2>
          <Field label="Préférences (facultatif)" hint="Ex. : végétarien, halal, sans lactose…"><input className="w-full" {...inp("diet_prefs")} /></Field>
          <Field label="Allergies ou restrictions (facultatif)"><input className="w-full" {...inp("allergies")} /></Field>
          <Field label="Repas par jour"><Choice cols={3} value={f.meals_per_day} onChange={set("meals_per_day")} options={[[3, "3"], [4, "4"], [5, "5"]]} /></Field>
        </>)}
        {step === 3 && (<>
          <h2 className="text-lg font-semibold">Entraînement</h2>
          <Field label="Ton niveau en musculation"><Choice value={f.experience} onChange={set("experience")} options={[["debutant", "Débutant"], ["intermediaire", "Intermédiaire"], ["avance", "Avancé"]]} /></Field>
          <Field label="Séances par semaine"><Choice cols={5} value={f.training_days} onChange={set("training_days")} options={[[2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"]]} /></Field>
          <Field label="Durée d'une séance (min)"><Choice cols={4} value={f.session_minutes} onChange={set("session_minutes")} options={[[30, "30"], [45, "45"], [60, "60"], [90, "90"]]} /></Field>
          <Field label="Où t'entraînes-tu ?"><Choice cols={2} value={f.place} onChange={set("place")} options={[["salle", "En salle"], ["maison", "À la maison (haltères)"]]} /></Field>
        </>)}
        {step === 4 && (plan ? (<>
          <h2 className="text-lg font-semibold">Ton plan de départ</h2>
          <p className="text-sm text-muted-foreground">Ces chiffres sont des <b>estimations</b> (formule de Mifflin-St Jeor). Observe ton poids pendant 2 à 3 semaines, puis ajuste dans ton profil. Ils ne remplacent pas l'avis d'un médecin ou d'un diététicien.</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-muted p-3"><div className="text-xs text-muted-foreground">Métabolisme de base</div><div className="text-lg font-semibold">{plan.bmr} kcal</div></div>
            <div className="rounded-xl bg-muted p-3"><div className="text-xs text-muted-foreground">Dépense quotidienne</div><div className="text-lg font-semibold">{plan.tdee} kcal</div></div>
          </div>
          <div className="rounded-xl border border-success/40 bg-success/5 p-4">
            <div className="text-xs text-muted-foreground">Objectif calorique initial{plan.deltaPct ? ` (${plan.deltaPct > 0 ? "+" : ""}${plan.deltaPct} %)` : ""}</div>
            <div className="text-2xl font-bold text-success">{plan.kcal} kcal / jour</div>
            <div className="mt-1 text-sm text-muted-foreground">Protéines {plan.protein} g · Glucides {plan.carbs} g · Lipides {plan.fat} g</div>
            {plan.floorApplied && <p className="mt-2 text-xs text-streak">Ton objectif a été relevé à un minimum de sécurité.</p>}
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">Programme proposé ({program.length} séances par semaine)</div>
            <ul className="space-y-1 text-sm text-muted-foreground">{program.map((d) => <li key={d.name}><span className="text-foreground">{d.name}</span> : {d.exercises.length} exercices</li>)}</ul>
          </div>
        </>) : <p className="text-sm text-streak">Impossible de calculer le plan avec ces informations. Reviens en arrière.</p>)}
        <Err>{err}</Err>
        <div className="flex justify-between gap-3 pt-2">
          {step > 1 ? <button className={btn2} onClick={() => { setErr(""); setStep(step - 1); }}>Retour</button> : <span />}
          {step < 4 ? <button className={btn} disabled={busy} onClick={next}>Continuer</button> : <button className={btn} disabled={busy || !plan} onClick={confirm}>Confirmer et activer mon plan</button>}
        </div>
      </div>
    </div>
  );
}
