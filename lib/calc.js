// Moteur de calcul centralisé : fonctions pures, testées (tests/calc.test.mjs)
export const ACTIVITY = {
  sedentaire: { f: 1.2, label: "Sédentaire (bureau, peu de marche)" },
  leger: { f: 1.375, label: "Légèrement actif (1 à 3 séances/sem.)" },
  modere: { f: 1.55, label: "Actif (3 à 5 séances/sem.)" },
  intense: { f: 1.725, label: "Très actif (6-7 séances/sem. ou métier physique)" },
};
export const OBJECTIVES = { perte: "Perdre du poids", muscle: "Prendre du muscle", maintien: "Maintien" };
export const parseNum = (s) => { const n = parseFloat(String(s ?? "").replace(",", ".")); return Number.isFinite(n) ? n : NaN; };
export const isValidWeightKg = (n) => Number.isFinite(n) && n >= 25 && n <= 400;
export const toUnit = (kg, unit) => (unit === "lb" ? kg * 2.20462 : kg);
export const fromUnit = (v, unit) => (unit === "lb" ? v / 2.20462 : v);
export const fmtW = (kg, unit = "kg") => (kg == null ? "–" : `${toUnit(Number(kg), unit).toFixed(1)} ${unit}`);
export const isoDay = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const shiftIso = (iso, n) => isoDay(addDays(new Date(iso + "T12:00:00"), n));
export const dayNum = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 864e5); };
export const ageFrom = (birthYear, now = new Date()) => (birthYear ? now.getFullYear() - Number(birthYear) : null);

export function bmr({ sex, weightKg, heightCm, age }) {
  if (![weightKg, heightCm, age].every(Number.isFinite) || weightKg <= 0 || heightCm <= 0 || age <= 0) return null;
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "f" ? -161 : 5));
}
export function targets({ sex, weightKg, heightCm, age, activity, objective }) {
  const b = bmr({ sex, weightKg, heightCm, age });
  const f = ACTIVITY[activity]?.f;
  if (!b || !f) return null;
  const tdee = Math.round(b * f);
  const adj = { perte: -0.15, muscle: 0.1, maintien: 0 }[objective] ?? 0;
  const floor = sex === "f" ? 1200 : 1500;
  const raw = tdee * (1 + adj);
  const kcal = Math.max(Math.round(raw / 10) * 10, floor);
  const protein = Math.min(Math.round(weightKg * (objective === "perte" ? 2 : objective === "muscle" ? 1.8 : 1.6)), Math.round((kcal * 0.35) / 4));
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { bmr: b, tdee, kcal, protein, carbs, fat, deltaPct: Math.round((kcal / tdee - 1) * 100), floorApplied: raw < floor };
}
export const profileTargets = (p) => (p && p.kcal_target ? { kcal: p.kcal_target, protein: p.protein_g || 0, carbs: p.carbs_g || 0, fat: p.fat_g || 0 } : null);

const r1 = (n) => Math.round(n * 10) / 10;
export const scaleFood = (food, grams) => { const k = grams / 100; return { kcal: Math.round(food.kcal100 * k), protein: r1(food.protein100 * k), carbs: r1(food.carbs100 * k), fat: r1(food.fat100 * k) }; };
export function sumEntries(entries) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const e of entries || []) for (const k in t) t[k] += Number(e[k]) || 0;
  return { kcal: Math.round(t.kcal), protein: Math.round(t.protein), carbs: Math.round(t.carbs), fat: Math.round(t.fat) };
}

export function movingAverage(points, window = 7) {
  const p = points.map((x) => ({ ...x, n: dayNum(x.date) }));
  return p.map((x) => { const w = p.filter((y) => y.n <= x.n && y.n > x.n - window); return { date: x.date, weight: x.weight, avg: +(w.reduce((a, y) => a + y.weight, 0) / w.length).toFixed(2) }; });
}
export function trend(points, { minPoints = 4, minSpan = 14, horizon = 42 } = {}) {
  if (!points?.length) return null;
  const p = points.map((x) => ({ x: dayNum(x.date), y: Number(x.weight) })).sort((a, b) => a.x - b.x);
  const last = p[p.length - 1].x;
  const w = p.filter((q) => q.x >= last - horizon);
  const span = w[w.length - 1].x - w[0].x;
  if (w.length < minPoints || span < minSpan) return null;
  const mx = w.reduce((a, q) => a + q.x, 0) / w.length, my = w.reduce((a, q) => a + q.y, 0) / w.length;
  const sxx = w.reduce((a, q) => a + (q.x - mx) ** 2, 0);
  if (!sxx) return null;
  return { kgPerWeek: +(((w.reduce((a, q) => a + (q.x - mx) * (q.y - my), 0)) / sxx) * 7).toFixed(2), n: w.length, span };
}
export function classifyTrend(t, objective = "perte") {
  if (!t) return { status: "insufficient", text: "Pas encore assez de pesées pour dégager une tendance fiable (au moins 4 sur 2 semaines). Continue de te peser régulièrement : une pesée isolée ne veut rien dire." };
  const s = t.kgPerWeek, a = Math.abs(s);
  const stag = t.span >= 21 ? { status: "stagnation", text: "Ton poids est stable depuis plus de 3 semaines. Vérifie la régularité de ton journal avant de changer quoi que ce soit." } : { status: "uncertain", text: "Tendance encore incertaine : les variations quotidiennes (eau, sel, digestion) peuvent masquer l'évolution. Attends quelques jours de plus." };
  if (objective === "perte") {
    if (s < -1) return { status: "too_fast", text: `Tu perds environ ${a} kg/sem., c'est rapide. Vérifie que tu manges assez et que tu récupères bien.` };
    if (s <= -0.15) return { status: "on_track", text: `Tendance compatible avec ton objectif : environ ${a} kg perdus par semaine.` };
    if (s < 0.15) return stag;
    return { status: "off_track", text: `Ton poids monte d'environ ${a} kg/sem. Relis ton journal alimentaire avant d'ajuster ton plan.` };
  }
  if (objective === "muscle") {
    if (s > 0.5) return { status: "too_fast", text: `Prise d'environ ${a} kg/sem. : une part risque d'être du gras. Une prise plus lente est souvent préférable.` };
    if (s >= 0.1) return { status: "on_track", text: `Prise régulière d'environ ${a} kg/sem., compatible avec ton objectif.` };
    if (s > -0.1) return stag;
    return { status: "off_track", text: `Ton poids baisse d'environ ${a} kg/sem., à l'opposé de ton objectif de prise.` };
  }
  return a < 0.2 ? { status: "on_track", text: "Ton poids est stable, comme prévu pour un maintien." } : { status: "off_track", text: `Ton poids évolue d'environ ${a} kg/sem., ce qui s'éloigne du maintien.` };
}

export const e1rm = (s) => s.kg * (1 + s.reps / 30);
export const best1rm = (sets) => Math.max(...sets.map(e1rm));
export const fmtSets = (sets) => sets.map((s) => `${s.kg}×${s.reps}`).join(" · ");
export const xpOf = (r) => 20 + 10 * r.sets.length;
export function parseSets(text) {
  const out = []; let kg = null;
  for (const t of String(text || "").trim().replace(/,/g, ".").split(/[\s;]+/).filter(Boolean)) {
    const m = t.toLowerCase().replace("×", "x").split("x");
    if (m.length === 2) { kg = parseFloat(m[0]); out.push({ kg, reps: parseInt(m[1], 10) }); }
    else if (m.length === 1 && kg !== null) out.push({ kg, reps: parseInt(m[0], 10) });
  }
  return out.filter((s) => s.kg >= 0 && s.kg <= 1000 && s.reps > 0 && s.reps <= 200);
}
export function nextTarget(sets, { repMin = 6, repMax = 10, step = 2.5 } = {}) {
  if (!sets?.length) return null;
  const top = Math.max(...sets.map((s) => s.kg));
  const topSets = sets.filter((s) => s.kg === top);
  if (topSets.every((s) => s.reps >= repMax)) return { kg: top + step, reps: repMin, text: `▲ Monte à ${top + step} kg, vise ${repMin} reps par série` };
  const reps = Math.max(...topSets.map((s) => s.reps)) + 1;
  return { kg: top, reps, text: `● Reste à ${top} kg, vise ${reps} reps` };
}
